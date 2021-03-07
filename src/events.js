import ready from 'modules/ready';

const events = {
  // debug: console.info,

  commandCancel: (command, reason, message, result) => {
    if (result) {
      result.prompts.forEach((prompt) => prompt.delete());
    }
  },

  commandRun: (command, promise, message, args, fromPattern, result) => {
    if (result) {
      result.prompts.forEach((prompt) => prompt.delete());
    }
  },

  commandError: (message, error) => console.error(error),

  ready,
};

export default events;
