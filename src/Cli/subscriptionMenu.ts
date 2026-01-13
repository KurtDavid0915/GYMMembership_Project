import inquirer from "inquirer";
import { MemberSubscriptionService } from "../Services/memberSubscription_service";

export async function showSubscriptionMenu(): Promise<void> {
  console.clear();
  console.log("\n=== Member Subscriptions ===\n");
    const choices = [
        "Add Subscription",
        "Update Subscription",
        "View Member Subscriptions",
        "Delete Subscription",
        "Back to Main Menu"
    ];
    choices.forEach((c, i) => console.log(`${i + 1}. ${c}`));   

    const { menuChoice } = await inquirer.prompt([
        {
            type: "input",
            name: "menuChoice",
            message: "Enter number or option name:",
            validate: (v) => v.trim() !== "" || "Required"
        }
    ]);
    let selected = "";
    const num = parseInt(menuChoice);
    if (!isNaN(num) && num >= 1 && num <= choices.length) {
        selected = choices[num - 1];
    }

    else {
        selected = choices.find(
            c => c.toLowerCase() === menuChoice.toLowerCase()
        ) || "";
    }
    switch (selected) {
        case "Add Subscription":
            await MemberSubscriptionService.addMemberSubscriptionPrompt();
            break;
        case "Update Subscription":
            await MemberSubscriptionService.updateMemberSubscription();   
            break;
        case "View Member Subscriptions":
            await MemberSubscriptionService.viewMemberSubscriptions();
            break;
        case "Delete Subscription":
            await MemberSubscriptionService.deleteMemberSubscription();
            break;
        case "Back to Main Menu":
            return;
        default:
            console.log("❌ Invalid selection.");
    }
    await showSubscriptionMenu(); 
}