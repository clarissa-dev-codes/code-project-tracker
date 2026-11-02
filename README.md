# Code Project Tracker

Code Project Tracker is a theme-matched developer dashboard integrated directly into your editor workspace. Manage software tasks, prioritize bugs, and structure milestones without interrupting your coding flow.


## Features

- **Persistent Sidebar Companion:** A compact checklist view on your left activity bar to monitor tasks at a glance while writing code.
- **Widescreen Kanban Board:** Expand into a full horizontal project management grid with dedicated lanes for Backlog, In Progress, and Done.
- **One-Click Workspace Toggle:** Open the full widescreen board directly from a button in the sidebar panel.
- **Zero-Config Local Storage:** Tasks are saved into a hidden .tracker-tasks.json file inside your open project workspace. Open your directory in another editor, and your progress stays synced.
- **Theme Integration:** Adapts automatically to light, dark, or high-contrast editor color schemes.

## How to Use

1. Open a workspace directory folder (File -> Open Folder).
2. Click on the Project Tracker clipboard icon in the left Activity Bar sidebar rail.
3. Type a task name in the input bar and click Add or press Enter.
4. Click the arrow button (->) inside a task card to advance it across your workflow stages. Click (x) to delete a task.
5. Click Open Full Dashboard to expand your pipeline into a complete horizontal Kanban canvas view.

## Project Storage Architecture

Your boards write directly to your local project folder root:
```json
// Found in your workspace as: .tracker-tasks.json
{
    "tasks": [
        {
            "id": 1714578900000,
            "title": "Refactor database controller models",
            "status": "In Progress"
        }
    ]
}
```

## License

MIT License. Developed by [clarissa-dev-codes](https://github.com).
