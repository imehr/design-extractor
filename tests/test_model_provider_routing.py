import importlib.util
import asyncio
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def load_ws_server_module():
    module_path = ROOT / "scripts/ws_extraction_server.py"
    spec = importlib.util.spec_from_file_location("ws_extraction_server_under_test", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_improvement_job_module():
    module_path = ROOT / "scripts/improvement_job.py"
    spec = importlib.util.spec_from_file_location("improvement_job_under_test", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_extract_brand_module():
    module_path = ROOT / "scripts/extract_brand.py"
    spec = importlib.util.spec_from_file_location("extract_brand_under_test", module_path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_model_settings_library_reads_global_and_project_overrides():
    source = (ROOT / "ui/lib/model-settings.ts").read_text()

    assert "model-providers.json" in source
    assert "active_provider" in source
    assert "phase_overrides" in source
    assert "test_cases" in source
    assert "test-case-model.json" in source
    assert "resolveTaskModelSelection" in source
    assert "setBrandTaskModelOverride" in source
    assert "clearBrandTaskModelOverride" in source


def test_test_case_generator_can_run_configured_model_providers():
    source = (ROOT / "ui/lib/test-cases.ts").read_text()

    assert "runModelTestCaseGenerator" in source
    assert "runClaudeCodeTestCaseGenerator" in source
    assert "runOllamaTestCaseGenerator" in source
    assert "runOpenAICompatibleTestCaseGenerator" in source
    assert "runCliTaskRunnerTestCaseGenerator" in source
    assert "CLI_TASK_RUNNER_PROVIDER_TYPES" in source
    for provider in ["codex", "cursor", "kimi", "minimax", "opencode"]:
        assert provider in source
    assert "/api/generate" in source
    assert "/v1/chat/completions" in source
    assert "provider_type" in source
    assert "model_source" in source


def test_test_cases_route_supports_project_model_override_actions():
    route = (ROOT / "ui/app/api/brands/[slug]/test-cases/route.ts").read_text()

    assert "setTestCaseModelOverride" in route
    assert 'body?.action === "model-settings"' in route
    assert "providerId" in route
    assert "useDefault" in route


def test_test_cases_ui_exposes_model_router_controls():
    page = (ROOT / "ui/app/brands/[slug]/page.tsx").read_text()

    assert "Model Router" in page
    assert "Use global default" in page
    assert "Save project override" in page
    assert "Project override" in page
    assert "Global default" in page
    assert "/settings" in page
    assert "handleTestCaseModelOverride" in page
    assert "onModelOverride" in page


def test_settings_page_can_change_execution_mode_and_cli_model():
    api = (ROOT / "ui/app/api/settings/model-providers/route.ts").read_text()
    page = (ROOT / "ui/app/settings/page.tsx").read_text()
    layout = (ROOT / "ui/app/layout.tsx").read_text()

    assert "readModelProviderSettings" in api
    assert "updateModelProviderSettings" in api
    assert "active_provider" in api
    assert '"/api/execution/mode"' in page
    assert "selected_cli" in page
    assert "local-cli" in page
    assert 'href="/settings"' in layout


def test_model_settings_backfills_dropdown_presets_for_task_runner_providers():
    source = (ROOT / "ui/lib/model-settings.ts").read_text()

    assert "DEFAULT_MODEL_PROVIDERS" in source
    assert "mergeModelPresets" in source
    for provider in [
        "claude-code",
        "codex",
        "cursor",
        "kimi",
        "minimax",
        "opencode",
        "ollama",
        "local-openai",
    ]:
        assert provider in source


def test_settings_page_supports_byok_provider_configuration():
    page = (ROOT / "ui/app/settings/page.tsx").read_text()

    assert '"byok"' in page
    assert "/api/execution/byok" in page
    assert "/api/execution/agents" in page
    assert "byokActive" in page
    assert "byokModels" in page


def test_monitoring_pipeline_uses_active_execution_selection():
    page = (ROOT / "ui/app/monitoring/page.tsx").read_text()

    assert 'fetch("/api/execution/mode"' in page
    assert "activeModelLabel" in page
    assert "pipeline={pipeline}" in page
    assert "agent.model" in page


def test_ws_extraction_server_builds_agent_commands_from_active_provider():
    source = (ROOT / "scripts/ws_extraction_server.py").read_text()

    assert "read_active_model_provider" in source
    assert "build_model_provider_command" in source
    assert "model-providers.json" in source
    assert "build_agent_command" in source


def test_ws_extraction_server_backfills_command_defaults_for_saved_provider_settings(tmp_path, monkeypatch):
    settings_dir = tmp_path / ".claude/design-library/settings"
    settings_dir.mkdir(parents=True)
    (settings_dir / "model-providers.json").write_text(json.dumps({
        "active_provider": "kimi",
        "providers": {
            "kimi": {
                "model": "kimi-for-coding/k2p6",
                "enabled": True,
            },
        },
    }))
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()

    provider = module.read_active_model_provider()
    command = module.build_model_provider_command(provider, "extract tal")

    assert provider["type"] == "kimi"
    assert provider["command"] == "kimi"
    assert command[0] == "kimi"
    assert "--model" in command
    assert "kimi-for-coding/k2p6" in command


def test_kimi_model_settings_fall_back_to_installed_cli_model(tmp_path, monkeypatch):
    settings_dir = tmp_path / ".claude/design-library/settings"
    settings_dir.mkdir(parents=True)
    (settings_dir / "model-providers.json").write_text(json.dumps({
        "active_provider": "kimi",
        "providers": {
            "kimi": {
                "model": "kimi-for-coding/k2p6",
                "enabled": True,
            },
        },
    }))
    kimi_dir = tmp_path / ".kimi"
    kimi_dir.mkdir()
    (kimi_dir / "config.toml").write_text(
        'default_model = "kimi-code/kimi-for-coding"\n'
        '\n'
        '[models."kimi-code/kimi-for-coding"]\n'
        'provider = "managed:kimi-code"\n'
    )
    monkeypatch.setenv("HOME", str(tmp_path))

    ws_module = load_ws_server_module()
    improvement_module = load_improvement_job_module()

    assert ws_module.read_active_model_provider()["model"] == "kimi-code/kimi-for-coding"
    assert improvement_module.read_active_model_provider()["model"] == "kimi-code/kimi-for-coding"


def test_ws_extraction_server_uses_installed_codex_exec_flags():
    module = load_ws_server_module()

    command = module.build_model_provider_command(
        {
            "id": "codex",
            "type": "codex",
            "command": "codex",
            "model": "gpt-5.2",
        },
        "extract tal",
    )

    assert command[:4] == ["codex", "exec", "--cd", str(ROOT)]
    assert "--dangerously-bypass-approvals-and-sandbox" in command
    assert "--ask-for-approval" not in command


def test_ws_extraction_server_creates_metadata_before_library_indexing(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()
    job = module.ExtractionJob(
        url="https://luminary.ai/",
        brand_name="Luminary",
        max_pages=5,
        ws=None,
    )

    metadata_path = job.ensure_brand_metadata()
    metadata = json.loads(metadata_path.read_text())

    assert metadata_path == tmp_path / ".claude/design-library/brands/luminary-ai/metadata.json"
    assert metadata["slug"] == "luminary-ai"
    assert metadata["name"] == "Luminary"
    assert metadata["source_url"] == "https://luminary.ai/"
    assert metadata["extracted_at"]
    assert metadata["extractor_version"] == "0.3.0"


def test_ws_extraction_server_runs_librarian_with_metadata_after_publish_failure(tmp_path, monkeypatch):
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()
    calls = []

    async def fake_stream(self, cmd, agent, cwd=None, timeout_s=None, timeout_ok=False):
        calls.append((agent, cmd))
        return (agent == "librarian", "")

    monkeypatch.setattr(module.ExtractionJob, "stream_subprocess", fake_stream)
    job = module.ExtractionJob(
        url="https://luminary.ai/",
        brand_name="Luminary",
        max_pages=5,
        ws=None,
    )

    ok = asyncio.run(job.run_phase_e())

    assert ok is False
    assert [agent for agent, _ in calls] == ["documentarian", "librarian"]
    librarian_cmd = calls[1][1]
    metadata_path = tmp_path / ".claude/design-library/brands/luminary-ai/metadata.json"
    assert "--metadata" in librarian_cmd
    assert str(metadata_path) in librarian_cmd
    assert metadata_path.exists()


def test_ws_extraction_server_builds_canonical_orchestrator_command():
    module = load_ws_server_module()
    job = module.ExtractionJob(
        url="https://luminary.ai/",
        brand_name="Luminary",
        max_pages=10,
        ws=None,
    )

    command = job.build_orchestrator_command()

    assert command[:3] == [
        module.sys.executable,
        str(module.REPO_ROOT / "scripts" / "extract_brand.py"),
        "--url",
    ]
    assert "https://luminary.ai/" in command
    assert "--page-limit" in command
    assert command[command.index("--page-limit") + 1] == "10"
    assert "--replica-batch-size" in command


def test_ws_extraction_server_clamps_orchestrator_page_limit():
    module = load_ws_server_module()
    too_low = module.ExtractionJob(
        url="https://example.com/",
        brand_name="Example",
        max_pages=1,
        ws=None,
    )
    too_high = module.ExtractionJob(
        url="https://example.com/",
        brand_name="Example",
        max_pages=99,
        ws=None,
    )

    low_command = too_low.build_orchestrator_command()
    high_command = too_high.build_orchestrator_command()

    assert low_command[low_command.index("--page-limit") + 1] == "5"
    assert high_command[high_command.index("--page-limit") + 1] == "10"


def test_extract_brand_cli_uses_configured_base_url_for_validation():
    source = (ROOT / "scripts/extract_brand.py").read_text()

    assert "DESIGN_EXTRACTOR_BASE_URL" in source
    assert 'os.environ.get("DESIGN_EXTRACTOR_BASE_URL")' in source


def test_extract_brand_cli_allows_full_package_validation_timeout():
    source = (ROOT / "scripts/extract_brand.py").read_text()

    # A full 5-10 page package across both viewports can exceed 15 minutes, so the
    # validation timeout must be generous (>= 900s). Assert the floor, not an exact
    # value, so tuning the budget upward does not break this test.
    match = re.search(r"VALIDATION_TIMEOUT\s*=\s*(\d+)", source)
    assert match, "VALIDATION_TIMEOUT constant not found"
    assert int(match.group(1)) >= 900
    assert "timeout=VALIDATION_TIMEOUT" in source


def test_publish_readiness_treats_missing_replica_sections_as_failures():
    source = (ROOT / "scripts/publish_brand.py").read_text()

    assert 'issues.append(f"FAIL: {page_name} replica has {h2_count} sections but DOM has {len(sections)}")' in source
    assert "is_html_snapshot_fallback" in source


def test_extract_brand_cli_repairs_incomplete_replicas_with_html_snapshots():
    source = (ROOT / "scripts/extract_brand.py").read_text()

    assert "repair_incomplete_replicas_with_html_snapshots" in source
    assert "_phase(\"5c\", repair_incomplete_replicas_with_html_snapshots" in source
    assert 'redirect("/api/brands/{slug}/preview/{page_slug}")' in source


def test_brand_detail_api_recognizes_nextjs_replica_routes():
    source = (ROOT / "ui/lib/library.ts").read_text()

    assert 'path.join(process.cwd(), "app", "brands", slug, "replica", "page.tsx")' in source
    assert "has_html_replica || has_react_replica" in source


# ── Execution mode (schema v2: execution_mode / selected_cli / byok) ────────


def _write_model_settings(tmp_path, payload):
    settings_dir = tmp_path / ".claude/design-library/settings"
    settings_dir.mkdir(parents=True, exist_ok=True)
    (settings_dir / "model-providers.json").write_text(json.dumps(payload))


def test_execution_mode_ignored_until_configured(tmp_path, monkeypatch):
    """v2 fields present but execution_configured false → legacy active_provider."""
    _write_model_settings(tmp_path, {
        "version": 2,
        "active_provider": "codex",
        "execution_mode": "local-cli",
        "execution_configured": False,
        "selected_cli": {"id": "kimi", "model": "kimi-k2-thinking"},
        "byok": {"active_provider": None, "models": {}},
        "providers": {"codex": {"model": "gpt-5.4", "enabled": True}},
    })
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()

    provider = module.read_active_model_provider()

    assert provider["id"] == "codex"
    assert provider["model"] == "gpt-5.4"


def test_execution_mode_local_cli_maps_claude_to_claude_code_with_model(tmp_path, monkeypatch):
    _write_model_settings(tmp_path, {
        "version": 2,
        "active_provider": "codex",
        "execution_mode": "local-cli",
        "execution_configured": True,
        "selected_cli": {"id": "claude", "model": "claude-opus-4-5"},
        "byok": {"active_provider": None, "models": {}},
        "providers": {},
    })
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()

    provider = module.read_active_model_provider()
    command = module.build_model_provider_command(provider, "extract tal")

    assert provider["id"] == "claude-code"
    assert provider["model"] == "claude-opus-4-5"
    assert command[0] == "claude"
    assert "claude-opus-4-5" in command


def test_execution_mode_local_cli_maps_cursor_agent_to_cursor_runner(tmp_path, monkeypatch):
    _write_model_settings(tmp_path, {
        "version": 2,
        "active_provider": "claude-code",
        "execution_mode": "local-cli",
        "execution_configured": True,
        "selected_cli": {"id": "cursor-agent", "model": "gpt-5"},
        "byok": {"active_provider": None, "models": {}},
        "providers": {},
    })
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()

    provider = module.read_active_model_provider()

    assert provider["id"] == "cursor"
    assert provider["type"] == "cursor"
    assert provider["model"] == "gpt-5"


def test_execution_mode_local_cli_default_model_keeps_cli_default(tmp_path, monkeypatch):
    """selected_cli.model 'default' is honored as-is (no --model flag downstream)."""
    _write_model_settings(tmp_path, {
        "version": 2,
        "active_provider": "claude-code",
        "execution_mode": "local-cli",
        "execution_configured": True,
        "selected_cli": {"id": "codex", "model": "default"},
        "byok": {"active_provider": None, "models": {}},
        "providers": {},
    })
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()

    provider = module.read_active_model_provider()
    command = module.build_model_provider_command(provider, "extract tal")

    assert provider["id"] == "codex"
    assert provider["model"] == "default"
    assert "--model" not in command


def test_execution_mode_local_cli_unwired_cli_falls_back_with_warning(tmp_path, monkeypatch, capsys):
    """qwen has no extraction runner → warn + legacy active_provider."""
    _write_model_settings(tmp_path, {
        "version": 2,
        "active_provider": "kimi",
        "execution_mode": "local-cli",
        "execution_configured": True,
        "selected_cli": {"id": "qwen", "model": "qwen3-coder-plus"},
        "byok": {"active_provider": None, "models": {}},
        "providers": {"kimi": {"model": "kimi-code/kimi-for-coding", "enabled": True}},
    })
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()

    provider = module.read_active_model_provider()
    out = capsys.readouterr().out

    assert provider["id"] == "kimi"
    assert provider["model"] == "kimi-code/kimi-for-coding"
    assert "No extraction runner is wired for CLI 'qwen'" in out
    assert "falling back" in out


def test_execution_mode_local_cli_maps_gemini_to_gemini_runner(tmp_path, monkeypatch):
    _write_model_settings(tmp_path, {
        "version": 2,
        "active_provider": "claude-code",
        "execution_mode": "local-cli",
        "execution_configured": True,
        "selected_cli": {"id": "gemini", "model": "gemini-3-pro-preview"},
        "byok": {"active_provider": None, "models": {}},
        "providers": {},
    })
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()

    provider = module.read_active_model_provider()
    command = module.build_model_provider_command(provider, "extract tal")

    assert provider["id"] == "gemini"
    assert command[0] == "gemini"
    assert "--approval-mode" in command
    assert "yolo" in command
    assert "gemini-3-pro-preview" in command


# ── Execution mode: BYOK runners (WS6) ──────────────────────────────────────


def _write_byok_store(tmp_path, keys):
    settings_dir = tmp_path / ".claude/design-library/settings"
    settings_dir.mkdir(parents=True, exist_ok=True)
    (settings_dir / "byok.json").write_text(json.dumps({
        "version": 1,
        "providers": {pid: {"api_key": key} for pid, key in keys.items()},
    }))


def _byok_settings(active_provider, models, *, fallback="codex"):
    return {
        "version": 2,
        "active_provider": fallback,
        "execution_mode": "byok",
        "execution_configured": True,
        "selected_cli": {"id": "claude", "model": "default"},
        "byok": {"active_provider": active_provider, "models": models},
        "providers": {"codex": {"model": "gpt-5.4", "enabled": True}},
    }


def test_execution_mode_byok_anthropic_routes_claude_with_key_env(tmp_path, monkeypatch, capsys):
    """anthropic → claude CLI runner; key injected as ANTHROPIC_API_KEY, never printed."""
    secret = "sk-ant-test-key-9876wxyz"
    _write_model_settings(tmp_path, _byok_settings("anthropic", {"anthropic": "claude-sonnet-4-6"}))
    _write_byok_store(tmp_path, {"anthropic": secret})
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    module = load_ws_server_module()
    monkeypatch.setattr(module.shutil, "which", lambda cmd: f"/usr/bin/{cmd}")

    provider = module.read_active_model_provider()
    command = module.build_model_provider_command(provider, "extract tal")
    env = module.model_provider_env(provider)
    out = capsys.readouterr().out

    assert provider["id"] == "claude-code"
    assert provider["model"] == "claude-sonnet-4-6"
    assert command[0] == "claude"
    assert "claude-sonnet-4-6" in command
    assert env is not None
    assert env["ANTHROPIC_API_KEY"] == secret
    # The key must never appear in logs or the argv — only name + last 4.
    assert secret not in out
    assert secret not in " ".join(command)
    assert "byok:anthropic" in out
    assert "$ANTHROPIC_API_KEY" in out
    assert "…wxyz" in out


def test_execution_mode_byok_missing_key_falls_back_with_warning(tmp_path, monkeypatch, capsys):
    _write_model_settings(tmp_path, _byok_settings("anthropic", {"anthropic": "claude-sonnet-4-6"}))
    _write_byok_store(tmp_path, {})
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    module = load_ws_server_module()
    monkeypatch.setattr(module.shutil, "which", lambda cmd: f"/usr/bin/{cmd}")

    provider = module.read_active_model_provider()
    env = module.model_provider_env(provider)
    out = capsys.readouterr().out

    assert provider["id"] == "codex"
    assert provider["model"] == "gpt-5.4"
    assert env is None
    assert "has no API key" in out
    assert "falling back" in out


def test_execution_mode_byok_openrouter_routes_opencode_with_prefixed_model(tmp_path, monkeypatch):
    """openrouter → opencode runner; model id gains the opencode provider prefix."""
    secret = "sk-or-test-key-1234abcd"
    _write_model_settings(tmp_path, _byok_settings(
        "openrouter", {"openrouter": "anthropic/claude-sonnet-4.6"},
    ))
    _write_byok_store(tmp_path, {"openrouter": secret})
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()
    monkeypatch.setattr(module.shutil, "which", lambda cmd: f"/usr/bin/{cmd}")
    catalog_calls = []

    def fake_catalog(opencode_provider, env):
        catalog_calls.append((opencode_provider, env))
        return True

    monkeypatch.setattr(module, "_opencode_lists_provider", fake_catalog)

    provider = module.read_active_model_provider()
    command = module.build_model_provider_command(provider, "extract tal")
    env = module.model_provider_env(provider)

    assert provider["id"] == "opencode"
    assert provider["model"] == "openrouter/anthropic/claude-sonnet-4.6"
    assert command[0] == "opencode"
    assert command[command.index("--model") + 1] == "openrouter/anthropic/claude-sonnet-4.6"
    assert env is not None
    assert env["OPENROUTER_API_KEY"] == secret
    # The catalog probe must run with the key injected (opencode only lists
    # providers whose credentials it can see).
    assert catalog_calls and catalog_calls[0][0] == "openrouter"
    assert catalog_calls[0][1]["OPENROUTER_API_KEY"] == secret


def test_execution_mode_byok_zai_injects_zhipu_env_var(tmp_path, monkeypatch):
    """opencode's zai provider consumes ZHIPU_API_KEY (models.dev), so the key
    stored under the 'zai' BYOK id must be injected under that name."""
    secret = "zai-test-key-2468acel"
    _write_model_settings(tmp_path, _byok_settings("zai", {"zai": "glm-4.7-flash"}))
    _write_byok_store(tmp_path, {"zai": secret})
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.delenv("ZAI_API_KEY", raising=False)
    monkeypatch.delenv("ZHIPU_API_KEY", raising=False)
    module = load_ws_server_module()
    monkeypatch.setattr(module.shutil, "which", lambda cmd: f"/usr/bin/{cmd}")
    monkeypatch.setattr(module, "_opencode_lists_provider", lambda *_: True)

    provider = module.read_active_model_provider()
    command = module.build_model_provider_command(provider, "extract tal")
    env = module.model_provider_env(provider)

    assert provider["id"] == "opencode"
    assert command[command.index("--model") + 1] == "zai/glm-4.7-flash"
    assert env is not None
    assert env["ZHIPU_API_KEY"] == secret
    # The lookup name must not leak into the injected env (deleted from
    # os.environ above, so any occurrence would be our injection).
    assert "ZAI_API_KEY" not in env


def test_execution_mode_byok_opencode_missing_binary_falls_back(tmp_path, monkeypatch, capsys):
    _write_model_settings(tmp_path, _byok_settings("minimax", {"minimax": "MiniMax-M2.5"}))
    _write_byok_store(tmp_path, {"minimax": "mm-test-key-5678efgh"})
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()
    monkeypatch.setattr(
        module.shutil, "which",
        lambda cmd: None if cmd == "opencode" else f"/usr/bin/{cmd}",
    )

    provider = module.read_active_model_provider()
    env = module.model_provider_env(provider)
    out = capsys.readouterr().out

    assert provider["id"] == "codex"
    assert provider["model"] == "gpt-5.4"
    assert env is None
    assert "'opencode' CLI" in out
    assert "not installed" in out
    assert "falling back" in out


def test_execution_mode_byok_provider_not_in_opencode_catalog_falls_back(tmp_path, monkeypatch, capsys):
    _write_model_settings(tmp_path, _byok_settings("xai", {"xai": "grok-4"}))
    _write_byok_store(tmp_path, {"xai": "xai-test-key-4242zzzz"})
    monkeypatch.setenv("HOME", str(tmp_path))
    module = load_ws_server_module()
    monkeypatch.setattr(module.shutil, "which", lambda cmd: f"/usr/bin/{cmd}")
    monkeypatch.setattr(module, "_opencode_lists_provider", lambda *_: False)

    provider = module.read_active_model_provider()
    out = capsys.readouterr().out

    assert provider["id"] == "codex"
    assert "does not list provider 'xai'" in out
    assert "falling back" in out


def test_execution_mode_byok_orchestrator_env_injects_provider_model_and_key(tmp_path, monkeypatch):
    """The extract_brand.py child must receive the runner override + the key."""
    secret = "mm-orch-test-key-1357bdfh"
    _write_model_settings(tmp_path, _byok_settings("minimax", {"minimax": "MiniMax-M2.5"}))
    _write_byok_store(tmp_path, {"minimax": secret})
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.delenv("MINIMAX_API_KEY", raising=False)
    module = load_ws_server_module()
    monkeypatch.setattr(module.shutil, "which", lambda cmd: f"/usr/bin/{cmd}")
    monkeypatch.setattr(module, "_opencode_lists_provider", lambda *_: True)

    job = module.ExtractionJob(
        url="https://luminary.ai/",
        brand_name="Luminary",
        max_pages=5,
        ws=None,
    )
    env = job.orchestrator_env()

    assert env["DESIGN_EXTRACTOR_PROVIDER"] == "opencode"
    assert env["DESIGN_EXTRACTOR_MODEL"] == "minimax/MiniMax-M2.5"
    assert env["MINIMAX_API_KEY"] == secret


def test_extract_brand_env_provider_override_skips_disabled_flag(tmp_path, monkeypatch):
    """DESIGN_EXTRACTOR_PROVIDER is an explicit orchestrator instruction; it must
    not be vetoed by the settings-file enabled flag (BYOK routes through
    runners the user may have disabled in the legacy picker)."""
    settings_dir = tmp_path / ".claude/design-library/settings"
    settings_dir.mkdir(parents=True)
    (settings_dir / "model-providers.json").write_text(json.dumps({
        "active_provider": "kimi",
        "providers": {"opencode": {"model": "opencode/big-pickle", "enabled": False}},
    }))
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setenv("DESIGN_EXTRACTOR_PROVIDER", "opencode")
    monkeypatch.setenv("DESIGN_EXTRACTOR_MODEL", "minimax/MiniMax-M2.5")
    module = load_extract_brand_module()
    monkeypatch.setattr(module.shutil, "which", lambda cmd: f"/usr/bin/{cmd}")
    monkeypatch.setattr(module, "MODEL_SETTINGS_PATH", tmp_path / ".claude/design-library/settings/model-providers.json")

    runner = module.load_model_runner()
    command = module.build_model_runner_command("extract tal", runner)

    assert runner["id"] == "opencode"
    assert runner["enabled"] is True
    assert runner["model"] == "minimax/MiniMax-M2.5"
    assert command[0] == "opencode"
    assert command[command.index("--model") + 1] == "minimax/MiniMax-M2.5"


def test_ws_server_maps_new_orchestrator_phases_to_pipeline():
    module = load_ws_server_module()

    mapping = module.ORCHESTRATOR_PHASE_TO_PIPELINE
    assert mapping["4.5"] == ("A", "asset-extractor")
    assert mapping["6.5"] == ("C", "visual-critic")
    assert mapping["7.5"] == ("E", "skill-packager")
    # The phase regex must recognize the new dotted banners.
    assert module.orchestrator_phase_from_output("Phase 4.5  Mirroring original pages") == "4.5"
    assert module.orchestrator_phase_from_output("Phase 7.5  Exporting open-design format") == "7.5"


def test_extract_brand_cli_supports_configured_task_runners():
    source = (ROOT / "scripts/extract_brand.py").read_text()

    for provider in ["codex", "cursor", "kimi", "minimax", "opencode", "ollama"]:
        assert f'"{provider}"' in source
    assert "--dangerously-bypass-approvals-and-sandbox" in source
    assert "--local-provider" in source
    assert "--workspace" in source
    assert "--dangerously-skip-permissions" in source
