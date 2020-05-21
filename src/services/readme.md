# Services layer

In this folder there are service modules.

## What goes here
* Business logic
* This is a good place for unit-testable code.

## What does not go here
* Avoid accepting request and response objects parameters. These objects should stay at the route layer and not leak into the business logic.
