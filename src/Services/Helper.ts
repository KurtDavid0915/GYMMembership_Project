import inquirer from "inquirer";

export async function waitForEnter(message = "\nPress Enter to return to the menu..."): Promise<void> {
  await inquirer.prompt([
    { type: "input", name: "pause", message },
  ]);
}
