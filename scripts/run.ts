// run the same script in every workspace

import glob from "glob"
import * as fs from "fs"
import * as cp from "child_process"
import * as pkg from "../package.json"

if (process.argv.length < 3) {
    console.info("usage: run.ts <script>")
    process.exit(0)
}

const script = process.argv[2]
const pattern = pkg.workspaces.length > 1 ?
    "{" + pkg.workspaces.join(",") + "}" :
    pkg.workspaces[0]

glob(pattern, (err, workspaces) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }

    let exitCode = 0

    for (const workspace of workspaces) {
        const subPkgFilename = workspace + "/package.json"
        if (fs.existsSync(subPkgFilename)) {
            const subPkg = JSON.parse(fs.readFileSync(subPkgFilename, "utf8"))
            if (subPkg.scripts.hasOwnProperty(script))
                try {
                    cp.execSync("npm run " + script, { cwd: workspace, stdio: "inherit" })
                } catch (error) {
                    exitCode = error.status
                }
        }
    }

    process.exit(exitCode)
})
