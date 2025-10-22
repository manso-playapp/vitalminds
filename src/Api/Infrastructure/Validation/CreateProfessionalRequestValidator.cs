using FluentValidation;
using VitalMinds.Clinic.Api.Application.Requests;

namespace VitalMinds.Clinic.Api.Infrastructure.Validation;

public class CreateProfessionalRequestValidator : AbstractValidator<CreateProfessionalRequest>
{
    public CreateProfessionalRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Apellido).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Especialidad).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Matricula).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Telefono).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleForEach(x => x.InstitucionIds).NotEmpty();
    }
}
