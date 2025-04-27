/*
State Transitions:
As a user, after adding a file, the system transitions from an initial state to a 'file-selected' state (showing the file list).
As a user, after initiating processing, the system transitions to an 'uploading/processing' state (showing a loading indicator).
As a user, after successful processing, the system transitions to an 'output-ready' state (showing generated content).
As a user, if an error occurs at any stage (upload or generation), the system transitions to an 'error' state (displaying an error message).
*/
