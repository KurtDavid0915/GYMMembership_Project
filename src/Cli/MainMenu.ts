import inquirer from "inquirer";
import { showMemberMenu } from "./memberMenu";
import { showMembershipPlans } from "./membershipplansMenu";
import { showSubscriptionMenu } from "./subscriptionMenu";
import { ExportService } from "../Services/exportService";
import { waitForEnter } from "../Services/Helper";

export async function showMainMenu(firstLoad = true): Promise<void> {
  if (firstLoad) console.clear();

  console.log("\n=== Main Menu ===");
  console.log("Please choose an option:\n");

  const choices = [
    "Member Transactions",
    "Membership Plans",
    "Member Subscriptions",
    "Export Data",
    "Exit",
  ];

    choices.forEach((c, i) => console.log(`${i + 1}. ${c}`));

  const { choice } = await inquirer.prompt([
    {
      type: "input",
      name: "choice",
      message: "Enter number or option name:",
      validate: (v) => v.trim() !== "" || "Required",
    },
  ]);

  let selected = "";
  const num = parseInt(choice);

  if (!isNaN(num) && num >= 1 && num <= choices.length) {
    selected = choices[num - 1];
  } else {
    selected =
      choices.find((c) => c.toLowerCase() === choice.toLowerCase()) || "";
  }

  switch (selected) {
    case "Member Transactions":
      await showMemberMenu();
      break;

    case "Membership Plans":
      await showMembershipPlans();
      break;

    case "Member Subscriptions":
      await showSubscriptionMenu();
      break;

    case "Export Data":
      await ExportService.exportAllToJson("Exports/data_export.json");
      console.log("\n✅ Export completed successfully!");
      await waitForEnter(); // pause so user can see log
      break;

    case "Exit":
      console.log("Goodbye!");
      process.exit(0);

    default:
      console.log("❌ Invalid option.");
  }

  // Recursive call, don’t clear
  await showMainMenu(false);
}
