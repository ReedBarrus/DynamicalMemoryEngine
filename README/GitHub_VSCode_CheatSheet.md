1. After a PR is merged on GitHub, sync local

    git checkout main
    git pull origin main

    That updates your local main to match GitHub main.

    If you had local changes lying around, Git may complain. In that case, stop and inspect before pulling.

2. Start a new local packet branch

    git checkout main
    git pull origin main
    git checkout -b packet/some-task-name

    Example:

        git checkout -b packet/replay-honesty-gate

    Now you are working on a fresh branch based on the latest main.

3. See what changed

    git status
    git diff

    Use this constantly.

    git status = what files changed / staged / unstaged
    git diff = exact line-by-line changes not yet committed

    If you already staged changes and want to see those:

        git diff --staged

4. Save a checkpoint commit locally

    git add .
    git commit -m "Implement replay honesty gate"

    If you only want specific files:

        git add path/to/file1 path/to/file2
        git commit -m "Wire replay model to reconstruction backend"

5. Push your branch to GitHub
    git push -u origin packet/some-task-name

    Example:

        git push -u origin packet/replay-honesty-gate

    The -u sets the upstream so future pushes on that branch can often just be:

        git push

6. After more local work on the same branch

    git status
    git add .
    git commit -m "Refine replay downgrade posture"
    git push

    Once upstream is set, git push is enough.

7. Bring a GitHub branch down locally

    If Codex browser or GitHub has a branch you want locally:

        git fetch origin
        git checkout -b review/codex-branch origin/codex-branch

    Example:

        git fetch origin
        git checkout -b review/packet-a origin/Packet_A_Codex_ReplayReconstructionClosure

    That creates a local branch tracking the remote one.

8. See all branches

    git branch
    git branch -r
    git branch -a
    git branch = local branches
    git branch -r = remote branches
    git branch -a = all branches

9. Switch branches

    git checkout main
    git checkout packet/replay-honesty-gate

10. If you want to throw away unstaged changes in one file

    git restore path/to/file

    If you want to unstage a file:

        git restore --staged path/to/file

    Very useful when you accidentally add too much.

    Minimal working loop

        This is the main loop:

            Start work
            git checkout main
            git pull origin main
            git checkout -b packet/my-task
            During work
            git status
            git diff
            Save work
            git add .
            git commit -m "Do the thing"
            git push -u origin packet/my-task
            After PR merge
            git checkout main
            git pull origin main

    That’s basically the spine.

A few super useful mental models

    main

        Your stable trunk.

    branch

        A temporary parallel path for one bounded packet.

    commit

        A saved checkpoint in that branch.

    push

        Upload your local commits to GitHub.

    pull

        Bring GitHub commits down to local.

    PR

        A review/merge proposal from one branch into another.

My strong recommendation for you

    For DME, keep this discipline:

        one packet = one branch
        one bounded seam = one PR
        never work directly on main unless you really mean to
        always pull latest main before making a new branch

        That matches your packetized workflow style really well. Your workflow contract is already optimized for bounded seams, acceptance/review, and minimal lawful patches.

        Tiny command block to keep around
    # sync main
        git checkout main
        git pull origin main

    # start packet branch
        git checkout -b packet/my-task

    # inspect
        git status
        git diff
        git diff --staged

    # save
        git add .
        git commit -m "Message"
        git push -u origin packet/my-task

    # after merge
        git checkout main
        git pull origin main