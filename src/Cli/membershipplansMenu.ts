import inquirer from "inquirer";
import { MembershipPlanService } from "../Services/membershipplans_service";
import { waitForEnter } from "../Services/Helper";

export async function showMembershipPlans() : Promise <void> {
    console.clear();
    console.log("\n=== Membership Plans ===\n");

    const choices = [
        "Add Membership Plan",
        "View Membership Plans",
        "Update Membership Plan",
        "Delete Membership Plan",
        "Back to Main Menu"
    ];

    choices.forEach((c, i) => console.log(`${i + 1}. ${c}`));

    const { menuChoice } = await inquirer.prompt([
        {
            type: "input",
            name: "menuChoice",
            message: "Enter number or option name:",
            validate: (v) => v.trim() !== "" || "Required",
        }
    ]);

    let selected = "";
    const num = parseInt(menuChoice);

    if (!isNaN(num) && num >= 1 && num <= choices.length) {
        selected = choices[num - 1];
    } else {
        selected = choices.find(
            c => c.toLowerCase() === menuChoice.toLowerCase()
        ) || "";
    }

    switch (selected) {
        case "Add Membership Plan":
            await MembershipPlanService.addMembershipPlanPrompt();
            break;
        case "View Membership Plans":
            await MembershipPlanService.viewMembershipPlans();
            break;  
        case "Update Membership Plan":
            await MembershipPlanService.updateMembershipPlan();
            break;
        case "Delete Membership Plan":
            await MembershipPlanService.deleteMembershipPlan();
            break;
        case "Back to Main Menu":
            return; 
        default:
            console.log("❌ Invalid selection.");
    }   

    await showMembershipPlans(); 


}