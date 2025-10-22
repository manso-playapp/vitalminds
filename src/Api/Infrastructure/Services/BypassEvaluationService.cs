using System.Text.Json;
using VitalMinds.Clinic.Api.Domain.Entities;

namespace VitalMinds.Clinic.Api.Infrastructure.Services;

public class BypassEvaluationService
{
    public bool Evaluate(Dictionary<string, decimal> puntajes, Dictionary<string, bool>? clinicalFlags, Parameters parameters)
    {
        clinicalFlags ??= new Dictionary<string, bool>();
        if (parameters.TestsHabilitados is null || !parameters.TestsHabilitados.TryGetValue("config_bypass", out var bypassConfigObj))
        {
            return false;
        }

        var bypassConfig = JsonSerializer.Deserialize<BypassConfig>(JsonSerializer.Serialize(bypassConfigObj));
        if (bypassConfig is null)
        {
            return false;
        }

        var testsPass = bypassConfig.Tests.All(test =>
        {
            if (!puntajes.TryGetValue(test.Code, out var value))
            {
                return test.Optional;
            }

            return test.Operator switch
            {
                "<=" => value <= test.Threshold,
                "<" => value < test.Threshold,
                ">=" => value >= test.Threshold,
                ">" => value > test.Threshold,
                _ => false
            };
        });

        var noFlags = true;
        if (bypassConfig.ClinicalFlags is not null)
        {
            noFlags = bypassConfig.ClinicalFlags.RequireNone
                ? clinicalFlags.All(flag => flag.Value == false)
                : bypassConfig.ClinicalFlags.Items?.All(item =>
                    !clinicalFlags.TryGetValue(item.Code, out var flagValue) || flagValue == false) ?? true;
        }

        return bypassConfig.RuleMode switch
        {
            "OR" => testsPass || noFlags,
            _ => testsPass && noFlags
        };
    }

    private record BypassConfig(string RuleMode, List<BypassTest> Tests, ClinicalFlagsConfig? ClinicalFlags);

    private record BypassTest(string Code, string Operator, decimal Threshold, bool Optional);

    private record ClinicalFlagsConfig(bool RequireNone, List<ClinicalFlagItem> Items);

    private record ClinicalFlagItem(string Code, string Label, string Type);
}
