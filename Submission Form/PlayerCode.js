var CodeList = PlayerCodeSheet.getRange(1, 2, PlayerCodeSheet.getLastRow(), 1).getValues();

function GeneratePlayerCode()
{
    var coderegex = "";
    for (var i = 0; i < CodeList.length; i++)
    {
        var element = CodeList[i];
        if (element[0] == "") 
        {
            var code = RandomRange(100000, 999999);
            while (HasCodeRepeat(code)) 
            {
                code = RandomRange(100000, 999999);
            }
            PlayerCodeSheet.getRange(i + 1, 2).setValue(code);
            coderegex += new String(code).substring(0, 3) + "|";
        }
        else if (typeof (element[0]) == "number")
        {
            coderegex += new String(element[0]).substring(0, 3) + "|";
        }
    }
    coderegex = coderegex.substring(0, coderegex.length - 1);
    var codeitem = Form.getItems()[6].asTextItem();
    var codevalidation = FormApp.createTextValidation();
    codevalidation.requireTextMatchesPattern("^(" + coderegex + ")[0-9]{3}$");
    codevalidation.setHelpText("Invalid Code!");
    codevalidation = codevalidation.build();
    codeitem.setValidation(codevalidation);

    /**
     * 
     * @param {Number} code
     * @returns {Boolean}
     */
    function HasCodeRepeat(code)
    {
        for (var i = 0; i < CodeList.length; i++)
        {
            var element = CodeList[i];
            if (typeof (element[0]) == "number") 
            {
                if (element == code) 
                {
                    return true;
                }
            }
        }
        return false;
    }
}



function PostPlayerCodeWebHook()
{
    var playerCodeList = PlayerCodeSheet.getRange(1, 1, PlayerCodeSheet.getLastRow(), 2).getValues();
    for (var pc = 1; pc < playerCodeList.length; pc++)
    {
        var element = playerCodeList[pc];
        for (var pl = 0; pl < PlayerList.length; pl++)
        {
            var player = PlayerList[pl];
            if (player.name == element[0] && !player.isRemoved)
            {
                var content = "**" + element[0] + "**\n" + element[1];
                var payload =
                    {
                        "content": content,
                    }
                if (!SendWebHook(payload)) 
                {
                    pc--;
                }
            }
        }
    }
}