"""Tests for long-term shot history read back from session logs."""

import json
import os

from openflight.history import ShotHistory


def _write(path, entries):
    with open(path, "w", encoding="utf-8") as handle:
        for entry in entries:
            handle.write(json.dumps(entry) + "\n")


def _shot(timestamp, club="7-iron", profile="p1", mode="rolling-buffer", ball=110.0):
    return {
        "type": "shot_detected",
        "timestamp": timestamp,
        "club": club,
        "profile_id": profile,
        "mode": mode,
        "ball_speed_mph": ball,
        "estimated_carry_yards": 150.0,
        "readings": [1, 2, 3],
    }


def test_collects_one_profile_across_sessions_oldest_first(tmp_path):
    _write(tmp_path / "session_2.jsonl", [_shot("2026-01-02T10:00:00"), _shot("x", profile="p2")])
    _write(tmp_path / "session_1.jsonl", [{"type": "session_start"}, _shot("2026-01-01T10:00:00")])

    history = ShotHistory(tmp_path).for_profile("p1", include_mock=False)

    assert [shot["timestamp"] for shot in history["shots"]] == [
        "2026-01-01T10:00:00",
        "2026-01-02T10:00:00",
    ]
    assert history["session_count"] == 2
    assert "readings" not in history["shots"][0]


def test_skips_deleted_and_mock_shots(tmp_path):
    _write(
        tmp_path / "session_1.jsonl",
        [
            _shot("a"),
            _shot("b"),
            _shot("m", mode="mock"),
            {"type": "shot_deleted", "timestamp": "a"},
        ],
    )
    reader = ShotHistory(tmp_path)

    assert [
        shot["timestamp"] for shot in reader.for_profile("p1", include_mock=False)["shots"]
    ] == ["b"]
    assert [shot["timestamp"] for shot in reader.for_profile("p1", include_mock=True)["shots"]] == [
        "b",
        "m",
    ]


def test_tolerates_a_partial_last_line_and_picks_up_appends(tmp_path):
    path = tmp_path / "session_1.jsonl"
    _write(path, [_shot("a")])
    with open(path, "a", encoding="utf-8") as handle:
        handle.write('{"type": "shot_detected", "timest')
    reader = ShotHistory(tmp_path)
    assert len(reader.for_profile("p1", include_mock=False)["shots"]) == 1

    _write(path, [_shot("a"), _shot("b")])
    os.utime(path, None)
    assert len(reader.for_profile("p1", include_mock=False)["shots"]) == 2


def test_missing_directory_is_empty(tmp_path):
    history = ShotHistory(tmp_path / "nope").for_profile("p1", include_mock=False)

    assert history["shots"] == []
    assert history["session_count"] == 0
