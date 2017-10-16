//Global Constants
var DataSheetApp = SpreadsheetApp.getActive();
var HistorySheet = DataSheetApp.getSheetByName("Series History");
var RankingSheet = DataSheetApp.getSheetByName("Rankings");
var PlayerStatsSheet = DataSheetApp.getSheetByName("Player Statistics");
var ManagementLogSheet = DataSheetApp.getSheetByName("Management Logs");

/** @type {GoogleAppsScript.Spreadsheet.SpreadsheetApp} */
var ValidationSheetApp;
/** @type {GoogleAppsScript.Spreadsheet.Spreadsheet} */
var ValidationSheet, PlayerCodeSheet, FullLogSheet;

function LoadValidationSheets()
{
    ValidationSheetApp = SpreadsheetApp.openById("1zQMN_t94oS55TwO5kI7p-QRkJti0dRwvGwEuGqkxMY4");
    ValidationSheet = ValidationSheetApp.getSheetByName("Series Form Submissions");
    PlayerCodeSheet = ValidationSheetApp.getSheetByName("Player Code");
    FullLogSheet = ValidationSheetApp.getSheetByName("Full Logs");
}

function Main()
{

}

function onDayTrigger(e)
{
    for (var key in PlayerList)
    {
        if (PlayerList.hasOwnProperty(key))
        {
            var element = PlayerList[key];
            element.mip++;

            if (Tools.MIPWarningPeriod(element.mip) && !element.isHoliday && !element.isRemoved)
            {
                var reminder;
                if (element.class == PlayerClass.NOBLEMAN || element.class == PlayerClass.KING)
                {
                    reminder = element.GetDiscordMention() + ", You have " + (HolidayModeMIP.HM - element.mip) + " days to WIN a Ranked/King/Knight to stay at your current class for the next month, not winning any of these of series will only delay your demotion by 2 days.";
                }
                else
                {
                    reminder = element.GetDiscordMention() + ", You have " + (HolidayModeMIP.HM - element.mip) + " days play any series or you will be placed into holiday mode. Joining back from holiday mode will cause to you to be placed at the last rank of your class."
                }
                var payload =
                    {
                        "username": "MKOTH Rankings",
                        "avatar_url": "https://cdn.discordapp.com/attachments/341163606605299716/352269545030942720/mkoth_thumb.jpg",
                        "content": reminder
                    };
            }
            if (element.mip >= 30 && !element.isHoliday && !element.isRemoved)
            {
                if (element.class == PlayerClass.NOBLEMAN || element.class == PlayerClass.KING)
                {
                    element.Demote();
                }
                else
                {
                    element.EnterHoliday();
                }
            }
        }
    }
    UpdatePlayerList();
    UpdateRankList();
}

function onOpen()
{
    //Create Management Control Panel
    var actions = SpreadsheetApp.newDataValidation().requireValueInList(Tools.Arrayify(Action));
    var run = SpreadsheetApp.newDataValidation().requireValueInList([Comfirmation.NO, Comfirmation.YES]);
    actions.setAllowInvalid(false);
    run.setAllowInvalid(false);
    ManagementLogSheet.getRange("B1").setDataValidation(actions);
    ManagementLogSheet.getRange("B1").setValue(Action.SELECT);
    ManagementLogSheet.getRange("B5").setDataValidation(run);
    ManagementLogSheet.getRange("B5").clearContent();
}

function onAdvancedEdit(e)
{
    Tools.SortSheets();

    //Debug logging for non management edits
    if (e.source.getSheetName() != ManagementLogSheet.getName())
    {
        FullLogSheet.appendRow([new Date(), "onEdit", e.source.getSheetName() + JSON.stringify(e.range.getA1Notation()) + JSON.stringify(e.user) + JSON.stringify(e)]);
    }

    //Discord id for player
    if (e.source.getSheetName() == PlayerStatsSheet.getName())
    {
        /** @type {GoogleAppsScript.Spreadsheet.Range} */
        var range = e.range;
        if (range.getColumn() == 10)
        {
            var payload =
                {
                    "username": "MKOTH Rankings",
                    "avatar_url": "https://cdn.discordapp.com/attachments/341163606605299716/352269545030942720/mkoth_thumb.jpg",
                    "content": "Welcome! <@!" + range.getValue() + ">, you are now officially added to the MKOTH Ranking, you will receive a submission id and be added to the submission form soon."
                };
            SendWebHook(payload);
        }
    }

    //Management Actions UI
    if (e.source.getSheetName() == ManagementLogSheet.getSheetName())
    {
        if (e.range.getA1Notation() == "B1")
        {
            ManagementLogSheet.getRange("B2").setDataValidation(null);
            ManagementLogSheet.getRange("A2:A3").clearContent();
            var action = ManagementLogSheet.getRange("B1").getValue();

            //Parsing action names and create action hint
            switch (action)
            {
                case Action.ADDPLAYER:
                    ManagementLogSheet.getRange("A2").setValue("Enter player Name: ");
                    break;

                case Action.REMOVEPLAYER:
                    ManagementLogSheet.getRange("A2").setValue("Choose player Name: ");
                    GetPlayerValidationList();
                    break;

                case Action.SUBMITSERIES:
                    ManagementLogSheet.getRange("A2").setValue("Submit all series ");
                    ManagementLogSheet.getRange("A3").setValue("from validation sheet.");
                    ManagementLogSheet.getRange("B2:B3").clearContent();
                    break;

                case Action.SWAPSERIESPLAYERS:
                    ManagementLogSheet.getRange("A2").setValue("Fix wrong player orders");
                    ManagementLogSheet.getRange("A3").setValue("from validation sheet.");
                    ManagementLogSheet.getRange("B2:B3").clearContent();
                    break;

                case Action.PROMOTEKNIGHT:
                    ManagementLogSheet.getRange("A2").setValue("Choose player Name: ");
                    GetPlayerValidationList();
                    break;

                case Action.READDPLAYER:
                    ManagementLogSheet.getRange("A2").setValue("Choose player Name: ");
                    ManagementLogSheet.getRange("A3").setValue("Old point value: ");
                    GetPlayerRemoved();
                    break;

                default:
                    ManagementLogSheet.getRange("A2").setValue("No Action Selected");
                    break;
            }
        }

        //Run Management Action
        if (e.range.getA1Notation() == "B5")
        {
            if (ManagementLogSheet.getRange("B5").getValue() == Comfirmation.YES)
            {
                onClickRun();
            }
            ManagementLogSheet.getRange("B5").clearContent();
        }
    }

    Tools.SortSheets();
}

function GetPlayerValidationList()
{
    var playernames = [];
    for (i = 0; i < PlayerList.length; i++)
    {
        if (!PlayerList[i].isRemoved)
        {
            playernames.push(PlayerList[i].name);
        }
    }
    var players = SpreadsheetApp.newDataValidation().requireValueInList(playernames);
    ManagementLogSheet.getRange("B2").setDataValidation(players);
}

function GetPlayerRemoved()
{
    var playernames = [];
    for (i = 0; i < PlayerList.length; i++)
    {
        if (PlayerList[i].isRemoved)
        {
            playernames.push(PlayerList[i].name);
        }
    }
    var players = SpreadsheetApp.newDataValidation().requireValueInList(playernames);
    ManagementLogSheet.getRange("B2").setDataValidation(players);
}