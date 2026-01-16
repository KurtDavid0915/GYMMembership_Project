import inquirer from "inquirer";
import { MemberService } from "../Services/memberService";

export async function showMemberMenu(): Promise<void> {
  console.clear();
  console.log("\n=== Member Transactions ===\n");

  const choices = [
    "Add Member",
    "View Members",
    "Search Members",
    "Update Member",
    "Delete Member",
    "Back to Main Menu"
  ];

  choices.forEach((c, i) => console.log(`${i + 1}. ${c}`));

  const { menuChoice } = await inquirer.prompt([
    {
      type: "input",
      name: "menuChoice",
      message: "Enter number or option name:",
      validate: (v) => v.trim() !== "" || "Required",
    },
  ]);

  let selected = "";
  const num = parseInt(menuChoice);

  if (!isNaN(num) && num >= 1 && num <= choices.length) {
    selected = choices[num - 1];
  } else {
    selected = choices.find((c) => c.toLowerCase() === menuChoice.toLowerCase()) || "";
  }

  switch (selected) {
    case "Add Member":
      await MemberService.addMemberPrompt();
      break;

    case "View Members":
      await MemberService.viewMembers();
      break;

    case "Search Members":
      await MemberService.searchMembers();  
      break;

    case "Update Member":
      await MemberService.updateMember();
      break;

    case "Delete Member":
      await MemberService.deleteMember();
      break;

    case "Back to Main Menu":
      return; // 🔙 exit this menu
      
    default:
      console.log("❌ Invalid selection.");
  }

  await showMemberMenu(); // 🔁 loop member menu
}
