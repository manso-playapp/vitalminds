using FluentValidation;
using VitalMinds.Clinic.Api.Application.Requests;

namespace VitalMinds.Clinic.Api.Infrastructure.Validation;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .NotEmpty();
    }
}
