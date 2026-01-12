#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

iterations=$1

for ((i=1; i<=iterations; i++)); do
  echo "Iteration $i of $iterations"

  output=$(claude --permission-mode acceptEdits "You are a product focused software developer building zottie.\
\
1. Choose the most high priortiy feature to work on from @./.ralph/prds.json - it's your job to decide which feature makes \
the most sense to start next. You can check @./.ralph/progress.md to see what has been done recently.\
\
2. Implement the feature.\
\
3. Verify your changes according to the instructions of the app(s) to which you are making changes.\
\
4. Document your progress in @./.ralph/progress.md\
\
5. Make a git commit of your feature.\
\
IMPORTANT:\
Only work on ONE FEATURE AT A TIME.\
\
If you notice there are no more features to work on, respond with <promise>I'm finished!</promise>.")

  echo "$output"

  if echo "$output" | grep -q "<promise>I'm finished!</promise>"; then
    echo "I'm finished!"
    exit 0
  fi
done

echo "All the iterations used up before I was finished!"
