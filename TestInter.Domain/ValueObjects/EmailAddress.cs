using TestInter.Domain.Exceptions;

namespace TestInter.Domain.ValueObjects;

public sealed class EmailAddress : IEquatable<EmailAddress>
{
    public string Value { get; }

    public EmailAddress(string value)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.Contains('@'))
        {
            throw new DomainException("Email address is invalid.");
        }

        Value = value.Trim().ToLowerInvariant();
    }

    public bool Equals(EmailAddress? other)
    {
        return other is not null && Value == other.Value;
    }

    public override bool Equals(object? obj)
    {
        return obj is EmailAddress other && Equals(other);
    }

    public override int GetHashCode()
    {
        return Value.GetHashCode(StringComparison.Ordinal);
    }

    public override string ToString()
    {
        return Value;
    }
}
