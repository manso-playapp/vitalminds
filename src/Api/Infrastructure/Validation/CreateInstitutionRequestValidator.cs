using FluentValidation;
using VitalMinds.Clinic.Api.Application.Requests;

namespace VitalMinds.Clinic.Api.Infrastructure.Validation;

public class CreateInstitutionRequestValidator : AbstractValidator<CreateInstitutionRequest>
{
    public CreateInstitutionRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(200);
        RuleFor(x => x.CUIT).NotEmpty().Matches(@"^\d{2}-\d{8}-\d$");
        RuleFor(x => x.RazonSocial).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Telefono).NotEmpty();
        RuleFor(x => x.CBU).NotEmpty().Length(22);
        RuleFor(x => x.AliasCBU).NotEmpty();
        RuleFor(x => x.Banco).NotEmpty();
    }
}
