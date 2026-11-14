"""Long-term shot history, read back from the session JSONL logs.

The live session lives in monitor memory and is gone after a restart or a
Clear session. Every shot is also appended to ``session_*.jsonl`` in the
session log directory, so the Stats history view reads those files back:
all ``shot_detected`` entries for one profile, minus shots deleted later.

Only a compact subset of each shot is returned (enough for stats and
gapping), and parsed files are cached by size and mtime so repeat requests
only re-read the session that is still being written.
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

SESSION_GLOB = "session_*.jsonl"
SHOT_ENTRY = "shot_detected"
DELETED_ENTRY = "shot_deleted"

# Fields the history view needs. Everything else (readings, diagnostics,
# experimental channels) stays on disk.
HISTORY_FIELDS = (
    "timestamp",
    "club",
    "profile_id",
    "mode",
    "ball_speed_mph",
    "club_speed_mph",
    "smash_factor",
    "estimated_carry_yards",
    "carry_spin_adjusted",
    "launch_angle_vertical",
    "launch_angle_horizontal",
    "spin_rpm",
    "spin_axis_deg",
)


class _ParsedSession:
    """Shots and deletions from one session file."""

    __slots__ = ("shots", "deleted")

    def __init__(self) -> None:
        self.shots: List[Dict[str, Any]] = []
        self.deleted: set = set()


def _parse_session(path: Path) -> _ParsedSession:
    parsed = _ParsedSession()
    try:
        with open(path, "r", encoding="utf-8") as handle:
            for line in handle:
                # Cheap pre-filter: most lines are raw radar entries.
                if SHOT_ENTRY not in line and DELETED_ENTRY not in line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue  # a partially written last line
                if not isinstance(entry, dict):
                    continue
                entry_type = entry.get("type")
                if entry_type == SHOT_ENTRY:
                    shot = {field: entry.get(field) for field in HISTORY_FIELDS}
                    shot["session"] = path.stem
                    parsed.shots.append(shot)
                elif entry_type == DELETED_ENTRY and entry.get("timestamp"):
                    parsed.deleted.add(str(entry["timestamp"]))
    except OSError as error:
        logger.warning("[history] could not read %s: %s", path, error)
    return parsed


class ShotHistory:
    """Read and cache shot history from a session log directory."""

    def __init__(self, log_dir: Path):
        self._log_dir = Path(log_dir)
        self._lock = threading.Lock()
        self._cache: Dict[Path, Tuple[Tuple[int, int], _ParsedSession]] = {}

    def _sessions(self) -> List[_ParsedSession]:
        try:
            paths = sorted(self._log_dir.glob(SESSION_GLOB))
        except OSError:
            return []
        sessions = []
        with self._lock:
            live = set(paths)
            for stale in [path for path in self._cache if path not in live]:
                del self._cache[stale]
            for path in paths:
                try:
                    stat = path.stat()
                except OSError:
                    continue
                key = (stat.st_size, stat.st_mtime_ns)
                cached = self._cache.get(path)
                if cached is None or cached[0] != key:
                    cached = (key, _parse_session(path))
                    self._cache[path] = cached
                sessions.append(cached[1])
        return sessions

    def for_profile(self, profile_id: str, include_mock: bool) -> Dict[str, Any]:
        """All of one profile's recorded shots, oldest first.

        Mock shots are left out unless ``include_mock`` (the server is in mock
        mode), so test sessions never pollute a real player's history.
        """
        sessions = self._sessions()
        deleted = set().union(*(session.deleted for session in sessions)) if sessions else set()
        shots = []
        session_names = set()
        for session in sessions:
            for shot in session.shots:
                if shot.get("profile_id") != profile_id:
                    continue
                if shot.get("timestamp") in deleted:
                    continue
                if not include_mock and shot.get("mode") == "mock":
                    continue
                if not isinstance(shot.get("ball_speed_mph"), (int, float)):
                    continue
                shots.append(shot)
                session_names.add(shot["session"])
        shots.sort(key=lambda shot: str(shot.get("timestamp") or ""))
        return {"profile_id": profile_id, "shots": shots, "session_count": len(session_names)}


_history: Optional[ShotHistory] = None
_history_dir: Optional[Path] = None


def get_shot_history(log_dir: Path) -> ShotHistory:
    """Shared history reader for a log directory."""
    global _history, _history_dir  # pylint: disable=global-statement
    if _history is None or _history_dir != Path(log_dir):
        _history = ShotHistory(log_dir)
        _history_dir = Path(log_dir)
    return _history
