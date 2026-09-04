"""API integration tests for the decisions endpoints."""

MAX_OPTIONS = 30


def create_decision(client, title="Where to eat?", options=None, **extra):
    payload = {
        "title": title,
        "options": [{"label": label} for label in (options or ["Sushi", "Pizza", "Tacos"])],
        **extra,
    }
    return client.post("/api/decisions", json=payload)


# --------------------------------------------------------------------------- #
# health
# --------------------------------------------------------------------------- #
def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# --------------------------------------------------------------------------- #
# create
# --------------------------------------------------------------------------- #
def test_create_decision(client):
    response = create_decision(client, description="dinner for two")
    assert response.status_code == 201

    body = response.json()
    assert body["title"] == "Where to eat?"
    assert body["description"] == "dinner for two"
    assert body["status"] == "open"
    assert body["winner"] is None
    assert [option["label"] for option in body["options"]] == ["Sushi", "Pizza", "Tacos"]


def test_create_decision_trims_title(client):
    response = client.post(
        "/api/decisions",
        json={
            "title": "  Pick one  ",
            "options": [{"label": "Sushi"}, {"label": "Pizza"}],
        },
    )
    assert response.status_code == 201
    assert response.json()["title"] == "Pick one"


def test_create_decision_requires_two_options(client):
    response = client.post(
        "/api/decisions",
        json={"title": "Only one", "options": [{"label": "Sushi"}]},
    )
    assert response.status_code == 422


def test_create_decision_rejects_empty_options(client):
    response = client.post(
        "/api/decisions",
        json={"title": "No options", "options": []},
    )
    assert response.status_code == 422


def test_create_decision_rejects_blank_title(client):
    response = create_decision(client, title="   ")
    assert response.status_code == 422


def test_create_decision_rejects_missing_title(client):
    response = client.post(
        "/api/decisions",
        json={"options": [{"label": "A"}, {"label": "B"}]},
    )
    assert response.status_code == 422


def test_create_decision_rejects_too_many_options(client):
    options = [{"label": f"Option {i}"} for i in range(MAX_OPTIONS + 1)]
    response = client.post("/api/decisions", json={"title": "Too many", "options": options})
    assert response.status_code == 422


def test_create_decision_rejects_duplicate_options(client):
    response = create_decision(client, options=["Sushi", "sushi"])
    assert response.status_code == 422


# --------------------------------------------------------------------------- #
# list / get
# --------------------------------------------------------------------------- #
def test_list_decisions_returns_summaries(client):
    first = create_decision(client, title="First").json()
    second = create_decision(client, title="Second").json()

    response = client.get("/api/decisions")
    assert response.status_code == 200

    items = response.json()
    # Newest first.
    assert [item["id"] for item in items] == [second["id"], first["id"]]
    item = items[0]
    assert item["title"] == "Second"
    assert item["option_count"] == 3
    assert item["status"] == "open"
    assert item["winner"] is None
    assert "options" not in item  # Summaries must stay lean.


def test_list_decisions_is_empty_initially(client):
    assert client.get("/api/decisions").json() == []


def test_get_decision_detail(client):
    created = create_decision(client).json()
    response = client.get(f"/api/decisions/{created['id']}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["status"] == "open"
    assert len(body["options"]) == 3


def test_get_missing_decision_returns_404(client):
    response = client.get("/api/decisions/999999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Decision not found"


# --------------------------------------------------------------------------- #
# options management
# --------------------------------------------------------------------------- #
def test_add_option(client):
    decision_id = create_decision(client).json()["id"]
    response = client.post(f"/api/decisions/{decision_id}/options", json={"label": "Burgers"})
    assert response.status_code == 200
    assert [option["label"] for option in response.json()["options"]] == [
        "Sushi",
        "Pizza",
        "Tacos",
        "Burgers",
    ]


def test_add_option_rejects_blank_label(client):
    decision_id = create_decision(client).json()["id"]
    response = client.post(
        f"/api/decisions/{decision_id}/options",
        json={"label": " "},
    )
    assert response.status_code == 422


def test_add_option_respects_maximum(client):
    options = [{"label": f"Option {i}"} for i in range(MAX_OPTIONS)]
    decision_id = client.post("/api/decisions", json={"title": "Full", "options": options}).json()["id"]

    response = client.post(f"/api/decisions/{decision_id}/options", json={"label": "Too many"})
    assert response.status_code == 400


def test_add_option_to_missing_decision_returns_404(client):
    response = client.post("/api/decisions/999999/options", json={"label": "A"})
    assert response.status_code == 404


def test_add_option_rejects_duplicate_label(client):
    decision_id = create_decision(client).json()["id"]
    response = client.post(f"/api/decisions/{decision_id}/options", json={"label": "sushi"})
    assert response.status_code == 400
    assert response.json()["detail"] == "An option with that label already exists"


def test_remove_option(client):
    decision_id = create_decision(client).json()["id"]
    option_id = client.get(f"/api/decisions/{decision_id}").json()["options"][0]["id"]

    response = client.delete(f"/api/decisions/{decision_id}/options/{option_id}")
    assert response.status_code == 200
    assert len(response.json()["options"]) == 2


def test_remove_option_respects_minimum(client):
    response = create_decision(client, options=["A", "B"])
    decision_id = response.json()["id"]
    option_id = client.get(f"/api/decisions/{decision_id}").json()["options"][0]["id"]

    response = client.delete(f"/api/decisions/{decision_id}/options/{option_id}")
    assert response.status_code == 400


def test_remove_option_from_missing_decision_returns_404(client):
    response = client.delete("/api/decisions/999999/options/1")
    assert response.status_code == 404


def test_remove_missing_option_returns_404(client):
    decision_id = create_decision(client).json()["id"]
    response = client.delete(f"/api/decisions/{decision_id}/options/999999")
    assert response.status_code == 404


# --------------------------------------------------------------------------- #
# updating
# --------------------------------------------------------------------------- #
def test_update_decision(client):
    decision_id = create_decision(client).json()["id"]

    response = client.patch(
        f"/api/decisions/{decision_id}",
        json={"title": "Dinner plans", "description": "no chips"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Dinner plans"
    assert body["description"] == "no chips"

    saved = client.get(f"/api/decisions/{decision_id}").json()
    assert saved["title"] == "Dinner plans"
    assert saved["description"] == "no chips"


def test_update_decision_partial(client):
    decision_id = create_decision(client).json()["id"]

    response = client.patch(f"/api/decisions/{decision_id}", json={"description": "outdoors"})
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Where to eat?"  # Untouched field.
    assert body["description"] == "outdoors"


def test_update_decision_clears_description(client):
    decision_id = create_decision(client, description="old note").json()["id"]

    response = client.patch(f"/api/decisions/{decision_id}", json={"description": None})
    assert response.status_code == 200
    assert response.json()["description"] is None


def test_update_decision_empty_payload_is_noop(client):
    decision_id = create_decision(client, description="keep me").json()["id"]

    response = client.patch(f"/api/decisions/{decision_id}", json={})
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Where to eat?"
    assert body["description"] == "keep me"


def test_update_decision_trims_values(client):
    decision_id = create_decision(client).json()["id"]

    response = client.patch(f"/api/decisions/{decision_id}", json={"title": "  Trimmed  "})
    assert response.status_code == 200
    assert response.json()["title"] == "Trimmed"


def test_update_decision_rejects_blank_title(client):
    decision_id = create_decision(client).json()["id"]
    response = client.patch(f"/api/decisions/{decision_id}", json={"title": "   "})
    assert response.status_code == 422


def test_update_decision_missing_decision_returns_404(client):
    response = client.patch(
        "/api/decisions/999999",
        json={"title": "Nope"},
    )
    assert response.status_code == 404


def test_update_option(client):
    decision_id = create_decision(client).json()["id"]
    option_id = client.get(f"/api/decisions/{decision_id}").json()["options"][0]["id"]

    response = client.patch(
        f"/api/decisions/{decision_id}/options/{option_id}",
        json={"label": "Ramen"},
    )
    assert response.status_code == 200
    assert [option["label"] for option in response.json()["options"]] == [
        "Ramen",
        "Pizza",
        "Tacos",
    ]


def test_update_option_same_label_is_noop(client):
    decision_id = create_decision(client).json()["id"]
    option_id = client.get(f"/api/decisions/{decision_id}").json()["options"][0]["id"]

    response = client.patch(
        f"/api/decisions/{decision_id}/options/{option_id}",
        json={"label": "Sushi"},
    )
    assert response.status_code == 200
    assert len(response.json()["options"]) == 3


def test_update_option_rejects_duplicate_label(client):
    decision_id = create_decision(client).json()["id"]
    first_id = client.get(f"/api/decisions/{decision_id}").json()["options"][0]["id"]

    response = client.patch(
        f"/api/decisions/{decision_id}/options/{first_id}",
        json={"label": "PIZZA"},  # Case-insensitive duplicate.
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "An option with that label already exists"


def test_update_option_rejects_blank_label(client):
    decision_id = create_decision(client).json()["id"]
    option_id = client.get(f"/api/decisions/{decision_id}").json()["options"][0]["id"]

    response = client.patch(
        f"/api/decisions/{decision_id}/options/{option_id}",
        json={"label": "  "},
    )
    assert response.status_code == 422


def test_update_option_missing_decision_returns_404(client):
    response = client.patch(
        "/api/decisions/999999/options/1",
        json={"label": "Whatever"},
    )
    assert response.status_code == 404


def test_update_option_from_other_decision_returns_404(client):
    created = create_decision(client).json()
    other_id = create_decision(client, title="Other").json()["id"]

    # An option that belongs to decision A must not be addressable via B.
    option_id = created["options"][0]["id"]
    response = client.patch(
        f"/api/decisions/{other_id}/options/{option_id}",
        json={"label": "Sneaky"},
    )
    assert response.status_code == 404
    # And it is left unchanged on its real decision.
    saved = client.get(f"/api/decisions/{created['id']}").json()
    assert [option["label"] for option in saved["options"]] == ["Sushi", "Pizza", "Tacos"]


# --------------------------------------------------------------------------- #
# picking
# --------------------------------------------------------------------------- #
def test_pick_winner(client):
    decision_id = create_decision(client).json()["id"]

    response = client.post(f"/api/decisions/{decision_id}/pick")
    assert response.status_code == 200
    body = response.json()
    assert body["decision_id"] == decision_id

    # The winner must be one of the decision's own options.
    options = client.get(f"/api/decisions/{decision_id}").json()["options"]
    assert body["winner"]["id"] in {option["id"] for option in options}
    assert body["winner"]["label"] in {option["label"] for option in options}


def test_pick_marks_decision_as_decided(client):
    decision_id = create_decision(client).json()["id"]
    picked = client.post(f"/api/decisions/{decision_id}/pick").json()

    detail = client.get(f"/api/decisions/{decision_id}").json()
    assert detail["status"] == "decided"
    assert detail["winner"]["id"] == picked["winner"]["id"]

    summary = client.get("/api/decisions").json()[0]
    assert summary["status"] == "decided"
    assert summary["winner"]["label"] == picked["winner"]["label"]


def test_repick_replaces_winner(client):
    decision_id = create_decision(client).json()["id"]
    first = client.post(f"/api/decisions/{decision_id}/pick").json()
    second = client.post(f"/api/decisions/{decision_id}/pick").json()

    detail = client.get(f"/api/decisions/{decision_id}").json()
    assert detail["winner"]["id"] == second["winner"]["id"]
    assert second["winner"]["id"] in {option["id"] for option in detail["options"]}
    assert first["winner"]["id"] in {option["id"] for option in detail["options"]}


def test_pick_missing_decision_returns_404(client):
    response = client.post("/api/decisions/999999/pick")
    assert response.status_code == 404


# --------------------------------------------------------------------------- #
# clearing + deleting
# --------------------------------------------------------------------------- #
def test_clear_winner(client):
    decision_id = create_decision(client).json()["id"]
    client.post(f"/api/decisions/{decision_id}/pick")

    response = client.delete(f"/api/decisions/{decision_id}/winner")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "open"
    assert body["winner"] is None


def test_delete_decision(client):
    decision_id = create_decision(client).json()["id"]

    response = client.delete(f"/api/decisions/{decision_id}")
    assert response.status_code == 204
    assert client.get(f"/api/decisions/{decision_id}").status_code == 404


def test_delete_missing_decision_returns_404(client):
    response = client.delete("/api/decisions/999999")
    assert response.status_code == 404