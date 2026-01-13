import inquirer from "inquirer";
import { showMemberMenu } from "./memberMenu";
import { showMembershipPlans } from "./membershipplansMenu";
import { showSubscriptionMenu } from "./subscriptionMenu";

export async function showMainMenu(): Promise<void> {
  console.clear();
  console.log("\n=== Main Menu ===");
  console.log("Please choose an option:\n");

  const choices = [
    "Member Transactions",
    "Membership Transactions",
    "Membership Plans",
    "Subscriptions",
    "Exit"
  ];

  choices.forEach((c, i) => console.log(`${i + 1}. ${c}`));

  const { choice } = await inquirer.prompt([
    {
      type: "input",
      name: "choice",
      message: "Enter number or option name:",
      validate: (v) => v.trim() !== "" || "Required"
    }
  ]);

  let selected = "";
  const num = parseInt(choice);

  if (!isNaN(num) && num >= 1 && num <= choices.length) {
    selected = choices[num - 1];
  } else {
    selected = choices.find(
      c => c.toLowerCase() === choice.toLowerCase()
    ) || "";
  }

  switch (selected) {
    case "Member Transactions":
      await showMemberMenu();
      break;

    case "Membership Transactions":
      console.log("🚧 Not implemented yet.");
      break;

    case "Membership Plans":
      await showMembershipPlans();
      break;
    
    case "Subscriptions":
      await showSubscriptionMenu();
      break;

    case "Exit":
      console.log("Goodbye!");
      process.exit(0);

    default:
      console.log("❌ Invalid option.");
  }

  await showMainMenu(); // 🔁 loop main menu
}
