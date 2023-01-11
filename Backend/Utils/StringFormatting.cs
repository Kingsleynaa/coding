namespace PMAS_CITI.Utils;

public static class StringFormatting
{
    // Returns input string as a hyphen seperated GUID
    public static string FormatStringAsGuid(string input)
    {
        return Guid.Parse(input).ToString("D");
    }

    public static Guid ConvertStringToGuid(string input)
    {
        return Guid.Parse(input);
    }
}