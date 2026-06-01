from app.api.routers.generate import _recommended_output


def test_recommended_output_selects_recommended_variant():
    result = {
        "recommended_variant": 2,
        "variants": [
            {
                "variant_id": 1,
                "angle": "a",
                "score": 0.5,
                "lines": [
                    {
                        "start": "0",
                        "end": "3",
                        "line": "hook a",
                        "function": "hook",
                        "retention_note": "nota",
                    }
                ],
                "analysis": {
                    "hook_strength": 0.5,
                    "curiosity_gaps": [],
                    "weak_points": [],
                },
            },
            {
                "variant_id": 2,
                "angle": "b",
                "score": 0.9,
                "lines": [
                    {
                        "start": "0",
                        "end": "3",
                        "line": "hook b",
                        "function": "hook",
                        "retention_note": "nota",
                    }
                ],
                "analysis": {
                    "hook_strength": 0.9,
                    "curiosity_gaps": [],
                    "weak_points": [],
                },
            },
        ],
    }

    output = _recommended_output(result)

    assert output.lines[0].line == "hook b"
