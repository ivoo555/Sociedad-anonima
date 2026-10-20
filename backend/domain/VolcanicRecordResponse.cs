namespace tpnavathon.Api.Domain;

/// <summary>
/// Public representation of a record returned by GET endpoints.
/// Internal sensor risk calculations are deliberately omitted.
/// </summary>
public sealed class VolcanicRecordResponse
{
    public string schema_version { get; init; } = "1.0.0";
    public string record_id { get; init; } = "";
    public string record_type { get; init; } = RecordTypes.Reading;
    public string node_id { get; init; } = "";
    public int group { get; init; }
    public string subsystem { get; init; } = "";
    public string timestamp { get; init; } = "";
    public string status { get; init; } = RecordStatuses.Active;
    public AlertLevels alert_level { get; init; }
    public VolcanicData data { get; init; } = new();
    public RecordMetadata metadata { get; init; } = new();

    public static VolcanicRecordResponse From(VolcanicRecord record) => new()
    {
        schema_version = record.schema_version,
        record_id = record.record_id,
        record_type = record.record_type,
        node_id = record.node_id,
        group = record.group,
        subsystem = record.subsystem,
        timestamp = record.timestamp,
        status = record.status,
        alert_level = record.alert_level,
        data = record.data,
        metadata = record.metadata
    };
}
