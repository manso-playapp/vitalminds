using FluentValidation;
using VitalMinds.Clinic.Api.Application.Requests;

namespace VitalMinds.Clinic.Api.Infrastructure.Validation;

public class CreateEpisodeRequestValidator : AbstractValidator<CreateEpisodeRequest>
{
    public CreateEpisodeRequestValidator()
    {
        RuleFor(x => x.PatientId).NotEmpty();
        RuleFor(x => x.InstitutionId).NotEmpty();
        RuleFor(x => x.ProfessionalId).NotEmpty();
        RuleFor(x => x.Titulo)
            .NotEmpty()
            .MaximumLength(200);
    }
}
