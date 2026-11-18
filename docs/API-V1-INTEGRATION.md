# API v1 adapter contract

The confirmed nb1 API v1 uses Action, Sequence, Step, Job, and local Pattern storage. The three pages implement these interfaces through their shared browser runtime. The daemon is the authority for input validation, color resolution, compilation and Jobs. This frontend owns no USB connection.

## Shared input and preview

Send exactly one of `action`, `sequence`, or `pattern_id` to `POST /v1/preview`. An optional `serial` asks nb1 for a cached device capability check. Show the returned `sequence`, `total_steps`, `nominal_duration_ms`, `required_capabilities`, and `device_check`.

For example, the target Action preview request is

```json
{
  "action": {
    "kind": "fade",
    "led": 1,
    "color": "lime",
    "duration_ms": 600
  }
}
```

A Sequence editor uses `steps[]` and explicit `timing`. Serial steps hold after each fade. Interval steps share an initial LED layout and advance by their intervals, with ordered target writes and potentially overlapping fades. Show the order and final settling time in preview details.

nb1 owns the compiler. The browser displays the returned Sequence and validates the response shape. Use that result for both human-readable inspection and copyable JSON.

## Colors

Offer RGB, HSB, Hex, and named-color controls for one editable target color. JSON uses `rgb8` or `hsv` for explicit color objects. Display the final Hex6 returned by `POST /v1/colors/resolve`.

`GET /v1/colors` lists local names and exact colors. `PUT /v1/colors/{name}` saves a resolved color. Action inputs may reference these as `@name`. Accepted Jobs and saved Patterns keep their resolved Sequence, so palette edits apply to new work.

## Job lifecycle

Submit `POST /v1/jobs` with `serial`, one author input, and a client-generated Job ID. Initial acceptance returns `202` and a query `Location`. Within the retention window, the same ID and input return the existing Job.

Retain the ID before sending. Query `GET /v1/jobs/{id}` for progress and use `POST /v1/jobs/{id}/cancel` for an explicit user stop. Show `queued`, `running`, and `cancelling` separately from `succeeded`, `cancelled`, and `failed`.

After a transport failure, query the known ID and preserve uncertainty if lookup cannot establish the outcome. Active records last throughout execution. Terminal records default to a thirty-minute TTL and 16,384-entry LRU limit, configurable through the daemon's `jobs.terminal_ttl` and `jobs.terminal_limit`. Capacity eviction or restart can remove them earlier. Queries update recency while the expiration time stays fixed. Let the user decide any subsequent run when the original outcome remains unknown.

## Connection and configuration scope

The Web page uses its own origin for the API; it does not select a configuration file or bake a storage path into its assets. The server selects its profile and library. On macOS and Linux, the profile and default library use `$XDG_CONFIG_HOME/nb1` or `~/.config/nb1`; Windows uses its native user-configuration directory. Device locks retain the native platform root independently of the profile/library choice. Use `nb1 config path` and `nb1 config show` to inspect settings. These commands do not inspect or reload an existing daemon.

MCP remains a separate HTTP client: its explicit `--endpoint` defaults to `http://127.0.0.1:8931` and does not read nb1 YAML. The HTTP CLI can derive its endpoint from profile `server.listen`. Keep Web, CLI and MCP attached to the same intended daemon when validating their shared Jobs and library.

Only `nb1 control --direct run [SERIAL] FILE` supports foreground direct execution. It compiles using the local library, always waits, rejects `--id`, and starts no HTTP server. That process's Job has no HTTP lookup or cross-process deduplication. Direct mode has no default total deadline; an explicit `--timeout` requests cancellation followed by separately bounded cleanup. Ctrl-C requests cancellation and cleanup too. Inspect exit status and JSON `mode`, `job`, and `engine_closed`; a closed Engine alone proves neither success nor an extinguished light, and a successful `hold` can leave color behind. These process-local semantics do not change HTTP/MCP timeout recovery or make direct Jobs visible in this Web page.

## Pattern Book

| Operation | Target interface | Presentation |
| --- | --- | --- |
| List | `GET /v1/patterns` | Read an array of ID and optional title summaries. |
| Inspect | `GET /v1/patterns/{id}` | Display the full saved Sequence. |
| Save | `PUT /v1/patterns/{id}` | Send `action` or `sequence`, with an optional title of up to 256 Unicode characters. Display the saved Sequence. |
| Preview or play | Preview or Job input with `pattern_id` | Use the current saved content for a new preview or run. |

Saving fixes the compiled Sequence in the computer library. An accepted Job keeps its own Sequence when the Pattern is updated. Save feedback identifies the saved record separately from playback progress.

Device RAM, nonvolatile storage, and startup behavior have separate capabilities and operations. Add those controls after their device-specific interface and qualification are available.

## Integration checks

Use an isolated HTTP server and fake device first. Cover all nine Actions, both Sequence timings, colors, aliases, Pattern updates, and Job recovery. Changing an alias or Pattern must preserve an existing Job ID's accepted run.

Opening pages, editing inputs, switching languages, and previewing should create no Job. Exercise explicit playback and stop, errors, cancellation, disconnected state, unknown outcomes, keyboard navigation, 390 px layouts, and reduced motion in English and Chinese.

Run syntax, locale and closed-inventory checks, then verify the produced manifest in a matching nb1 integration tree. Limits are 768 KiB decoded base UI, 6 MiB total stored assets and 16 MiB total decoded assets, including the manifest. Physical acceptance remains a separate native/hardware task.

## Device selection

Device choices are sorted by serial using byte order, not USB insertion order. On first load, the first online device is selected; if all are offline, the first configured serial remains visible with its connection status. Refresh and language changes preserve the current target, including an offline or removed device. A removed target stays selected with an explanation until the user chooses another device. Multiple-device feedback shows the configured count and current target. Play requires a confirmed online target and still validates and submits that explicit serial; selection and refresh never play or retry a Job.
