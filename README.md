# HelpDesk Hub

Task 1: User Login As an employee, support staff, or manager,
I want to log in to the HelpDesk Lite system,
so that I can securely access the system based on my role.  Task 2: Define User Roles and Permissions 

Define the user roles for HelpDesk Lite and the permissions of each role.

Roles:

Employee

Support Staff

Manager

The output should identify what each role can view, create, update, assign, and resolve.       Task 3: Employee Can Submit a Support Request 

As an employee,
I want to submit a support request,
so that the support team can review and resolve my issue. 



Employee can create a new support request.

Required fields must be completed.

The request is saved successfully.

A unique ticket ID is generated.

The ticket status is set to "New".

Task 4: Support Staff Can View Submitted Tickets 

As a support staff member,
I want to view all submitted support tickets,
so that I can review and handle incoming requests.







Support staff can view a list of submitted tickets.

Each ticket displays its ID, title, status, priority, and submitter.

Support staff can open a ticket to view its details.

Task 5: Support Staff Can Assign a Ticket 

As a support staff member,
I want to assign a ticket to myself or another support member,
so that every ticket has a clear owner.



A ticket can be assigned to a support staff member.

The current assignee is displayed.

The assignee can be changed when needed.

Task 6: Define Ticket Workflow Statuses 

The ticket lifecycle is not fully defined in the requirements.

Determine:

Initial status

Working statuses

Final status

Allowed transitions between statuses

This task must be completed before implementing ticket workflow. Task 7: Define Required Ticket Information 

The required information for submitting a support request is not fully defined.

Clarify:

Required fields

Optional fields

Attachments

Categories

Priority

Task 8: Define Manager Dashboard Requirements 

Manager visibility requirements are not fully defined.

Clarify:

Required metrics

Open tickets

Delayed tickets

Workload per support member

 Task 9: Support Staff Can Update Ticket Status As a support staff member,
I want to update the status of a support request,
so that employees can track the progress of their requests.             conect it with SupaBase

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a2d385ca-d9fd-4c35-86dd-6ab754e8dddd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
