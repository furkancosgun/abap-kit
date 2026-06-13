#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = "1.0.0";

function log(message, type = "info") {
    const colors = {
        info: "\x1b[36m",
        success: "\x1b[32m",
        warning: "\x1b[33m",
        error: "\x1b[31m",
        reset: "\x1b[0m"
    };

    const color = colors[type] || colors.info;
    console.log(`${color}${message}${colors.reset}`);
}

function showHelp() {
    console.log(`
  \x1b[35m▲ ABAP Kit CLI\x1b[0m \x1b[2mv${VERSION}\x1b[0m
  \x1b[36mModern ABAP Development Suite for Node.js\x1b[0m

  \x1b[33mUsage:\x1b[0m
    $ abap-kit <command> [options]

  \x1b[33mCommands:\x1b[0m
    \x1b[32mcreate <name>\x1b[0m      Scaffold a new modern ABAP project
    \x1b[32mci\x1b[0m                 Generate automated GitHub Actions workflow
    \x1b[32m-h, --help\x1b[0m         Display helper documentation
    \x1b[32m-v, --version\x1b[0m      Show runtime engine version

  \x1b[33mExample:\x1b[0m
    $ abap-kit create my-awesome-abap
  `);
}

async function getLatestVersion(packageName) {
    try {
        const version = execSync(`npm view ${packageName} version`, {
            encoding: "utf-8"
        }).trim();
        return `^${version}`;
    } catch (error) {
        log(`⚠ Warning: Could not fetch version for ${packageName}, using wildcard`, "warning");
        return "*";
    }
}

async function createPackageJson(targetDir, projectName) {
    log(`📝 Generating package.json manifest...`, "info");
    log(`🔍 Resolving latest ecosystem dependencies...`, "info");

    const cli = await getLatestVersion("@abaplint/cli")
    const runtime = await getLatestVersion("@abaplint/runtime");
    const transpiler = await getLatestVersion("@abaplint/transpiler-cli");
    const database = await getLatestVersion("@abaplint/database-sqlite");

    const packageJson = {
        name: projectName,
        version: "1.0.0",
        type: "module",
        engines: {
            node: ">=18.0.0"
        },
        scripts: {
            lint: "abaplint",
            fix: "abaplint --fix",
            unit: "rm -rf output && abap_transpile && node --expose-gc output/index.mjs",
            exec: "rm -rf output && abap_transpile && node --expose-gc output/${PROGRAM:-zdemo}.prog.mjs"
        },
        devDependencies: {
            "@abaplint/cli":cli,
            "@abaplint/runtime": runtime,
            "@abaplint/transpiler-cli": transpiler,
            "@abaplint/database-sqlite": database
        }
    };

    fs.writeFileSync(
        path.join(targetDir, "package.json"),
        JSON.stringify(packageJson, null, 2)
    );
}

async function createSetupMjs(targetDir) {
    log(`⚡ Harnessing database lifecycle (setup.mjs)...`, "info");
    const setupCode = `import { SQLiteDatabaseClient } from "@abaplint/database-sqlite";

export async function setup(abap, schemas, insert) {
  abap.context.databaseConnections["DEFAULT"] = new SQLiteDatabaseClient();
  await abap.context.databaseConnections["DEFAULT"].connect();
  await abap.context.databaseConnections["DEFAULT"].execute(schemas.sqlite);
  await abap.context.databaseConnections["DEFAULT"].execute(insert);
}
`;

    fs.writeFileSync(path.join(targetDir, "setup.mjs"), setupCode);
}

async function createGitIgnore(targetDir) {
    log(`🛡️ Injecting version control protections (.gitignore)...`, "info");
    const gitignore = `output/
node_modules/
package-lock.json
*.log
.DS_Store
*.swp
*.swo
*~
.vscode/settings.json
`;

    fs.writeFileSync(path.join(targetDir, ".gitignore"), gitignore);
}

async function createSampleProgram(srcDir) {
    log(`🌱 Planting blueprint sample code (zdemo.prog.abap)...`, "info");
    const sampleCode = `REPORT zdemo.

START-OF-SELECTION.
  DATA message TYPE string.

  message = 'Hello World from abap-kit!'.
  DO strlen( message )  TIMES.
    WRITE / substring( val = message
                       len = sy-index ).
  ENDDO.`;

    fs.writeFileSync(path.join(srcDir, "zdemo.prog.abap"), sampleCode);
}

async function createVsCodeConfig(targetDir) {
    log(`💻 Configuring IDE workspace presets (.vscode)...`, "info");
    const config = {
        recommendations: [
            "larshp.vscode-abap",
            "larshp.vscode-abaplint"
        ]
    };
    fs.mkdirSync(path.join(targetDir, ".vscode"), { recursive: true });
    fs.writeFileSync(
        path.join(targetDir, ".vscode", "extensions.json"),
        JSON.stringify(config, null, 2)
    );
}

async function createReadme(targetDir, projectName) {
    log(`📚 Binding documentation ledger (README.md)...`, "info");
    const content = `# ${projectName}

ABAP project successfully created with **abap-kit**.

## 🚀 Getting Started

\`\`\`bash
# Navigate to project directory
cd ${projectName}

# Install dependencies
npm install

# Run the default zdemo program
npm run exec
\`\`\`

## 🛠️ Available Commands

- **\`npm run lint\`** - Analyze code with abaplint
- **\`npm run fix\`** - Auto-fix fixable issues  
- **\`npm run unit\`** - Run unit tests
- **\`npm run exec\`** - Transpile and run default \`zdemo\` program
- **\`PROGRAM=myprogram npm run exec\`** - Run a specific program

## 📂 Project Structure

\`\`\`
${projectName}/
├── src/                          # ABAP source files
│   └── zdemo.prog.abap          # Sample program
├── output/                       # Transpiled JavaScript (generated)
├── package.json                  # Project configuration
├── setup.mjs                     # SQLite database setup
├── abaplint.json                 # Linter configuration
├── abaplint-transpiler.json     # Transpiler configuration
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
\`\`\`

## 🔧 Configuration Files

- **\`abaplint.json\`** - abaplint code analysis rules
- **\`abaplint-transpiler.json\`** - Transpiler settings (input/output folders, libraries)
- **\`setup.mjs\`** - SQLite database connection setup
- **\`package.json\`** - npm dependencies and scripts

## 📦 Dependencies

- **@abaplint/runtime** - ABAP runtime environment
- **@abaplint/transpiler-cli** - ABAP to JavaScript transpiler
- **@abaplint/database-sqlite** - SQLite database support

## 🔗 Useful Links

- [abaplint GitHub](https://github.com/abaplint/abaplint)
- [open-abap](https://github.com/open-abap/open-abap)
- [ABAP Language Reference](https://help.sap.com/doc/abapdocu_latest_index_htm/latest/en-US/index.htm)

---

Created with ❤️ by **abap-kit**
`;
    fs.writeFileSync(path.join(targetDir, "README.md"), content);
}

async function createTranspilerConfig(targetDir) {
    log(`⚙️  Calibrating transpiler configuration matrix...`, "info");
    const transpilerConfig = {
        input_folder: "src/",
        output_folder: "output/",
        libs: [
            {
                url: "https://github.com/open-abap/open-abap-core"
            }
        ],
        write_unit_tests: true,
        write_source_map: true,
        options: {
            ignoreSyntaxCheck: true,
            addFilenames: true,
            addCommonJS: true,
            unknownTypes: "runtimeError",
            setup: {
                filename: "../setup.mjs",
                preFunction: "setup"
            }
        }
    };

    fs.writeFileSync(
        path.join(targetDir, "abaplint-transpiler.json"),
        JSON.stringify(transpilerConfig, null, 2)
    );
}

function installDependencies(targetDir) {
    return new Promise((resolve, reject) => {
        log("📦 Spawning local environment dependencies (this may take a few seconds)...", "info");
        try {
            execSync("npm install", { cwd: targetDir, stdio: "inherit" });
            resolve();
        } catch (error) {
            log("❌ Critical: Ecosystem dependency sync failed", "error");
            reject(error);
        }
    });
}

function generateAbaplintConfig(targetDir) {
    return new Promise((resolve) => {
        log("✨ Orchestrating static analysis schema (abaplint.json)...", "info");
        const configPath = path.join(targetDir, "abaplint.json");

        try {
            execSync("npx abaplint -d > abaplint.json", {
                cwd: targetDir,
                stdio: "ignore",
                shell: true
            });
            resolve();
        } catch (error) {
            const defaultConfig = {
                "global": {
                    "files": "/src/**/*.*",
                    "exclude": [],
                    "noIssues": [],
                    "skipGeneratedBOPFInterfaces": false,
                    "skipGeneratedFunctionGroups": false,
                    "skipGeneratedGatewayClasses": false,
                    "skipGeneratedPersistentClasses": false,
                    "skipGeneratedProxyClasses": false,
                    "skipGeneratedProxyInterfaces": false,
                    "useApackDependencies": false,
                    "skipIncludesWithoutMain": false,
                    "errorOnDuplicateFilenames": false
                },
                "dependencies": [
                    {
                        "url": "https://github.com/abaplint/deps",
                        "folder": "/deps",
                        "files": "/src/**/*.*"
                    }
                ],
                "syntax": {
                    "version": "v752",
                    "errorNamespace": "^(Z|Y|LCL_|TY_|LIF_)",
                    "globalConstants": [],
                    "globalMacros": []
                },
                "rules": {
                    "cds_naming": {
                        "exclude": [],
                        "severity": "Error",
                        "basicInterfaceView": "ZI_",
                        "compositeInterfaceView": "ZI_",
                        "consumptionView": "ZC_",
                        "basicRestrictedReuseView": "ZR_",
                        "compositeRestrictedReuseView": "ZR_",
                        "privateView": "ZP_",
                        "remoteAPIView": "ZA_",
                        "viewExtend": "ZX_",
                        "extensionIncludeView": "ZE_",
                        "derivationFunction": "ZF_",
                        "abstractEntity": "ZD_"
                    },
                    "empty_structure": {
                        "exclude": [],
                        "severity": "Error",
                        "loop": true,
                        "loopAllowIfSubrc": true,
                        "if": true,
                        "while": true,
                        "case": true,
                        "select": true,
                        "do": true,
                        "at": true,
                        "try": true,
                        "when": true
                    },
                    "local_variable_names": {
                        "exclude": [],
                        "severity": "Error",
                        "patternKind": "required",
                        "ignoreNames": [],
                        "ignorePatterns": [],
                        "expectedData": "^L._.+$",
                        "expectedConstant": "^LC_.+$",
                        "expectedFS": "^<FS_.+>$"
                    },
                    "method_parameter_names": {
                        "exclude": [],
                        "severity": "Error",
                        "patternKind": "required",
                        "ignoreNames": [],
                        "ignorePatterns": [],
                        "ignoreExceptions": true,
                        "importing": "^I._.+$",
                        "returning": "^R._.+$",
                        "changing": "^C._.+$",
                        "exporting": "^E._.+$"
                    },
                }
            };
            fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
            resolve();
        }
    });
}

async function createProject(projectName) {
    const targetDir = path.resolve(process.cwd(), projectName);

    if (fs.existsSync(targetDir)) {
        log(`❌ Error: Workspace directory "${projectName}" already exists!`, "error");
        process.exit(1);
    }

    try {
        log(`📁 Constructing standalone workspace "${projectName}"...`, "info");
        fs.mkdirSync(targetDir, { recursive: true });

        await createPackageJson(targetDir, projectName);
        await createSetupMjs(targetDir);
        await createGitIgnore(targetDir);
        await createTranspilerConfig(targetDir);
        await createVsCodeConfig(targetDir);

        const srcDir = path.join(targetDir, "src");
        fs.mkdirSync(srcDir, { recursive: true });
        log(`📂 Root source registry 'src/' mapped.`, "info");

        await createSampleProgram(srcDir);
        await installDependencies(targetDir);
        await generateAbaplintConfig(targetDir);
        await createReadme(targetDir, projectName);

        console.log("\n------------------------------------------------");
        log(`✨ SUCCESS: Project "${projectName}" forged successfully!`, "success");
        log(`📂 Target Path: ${targetDir}\n`, "info");
        log(`To initialize development:`, "success");
        log(`  $ cd ${projectName}`, "info");
        log(`  $ npm run exec\n`, "info");
        log(`Executable Environment Core Scripts:`, "success");
        log(`  npm run lint            | Run static syntax analysis`, "info");
        log(`  npm run fix             | Trigger linter automated code-fix`, "info");
        log(`  npm run unit            | Execute compilation test suites`, "info");
        log(`  npm run exec            | Run application (Defaults to zdemo)`, "info");
        log(`  PROGRAM=<file> npm run exec | Run specific executable program`, "info");
        console.log("------------------------------------------------\n");
    } catch (error) {
        log(`❌ Error: Execution halted due to -> ${error.message}`, "error");
        process.exit(1);
    }
}

function createGitHubWorkflow(targetDir) {
    const workflowContent = `name: ABAP Kit CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run abaplint
      run: npm run lint

    - name: Run Unit Tests
      run: npm run unit
`;

    const workflowDir = path.join(targetDir, ".github", "workflows");
    fs.mkdirSync(workflowDir, { recursive: true });
    fs.writeFileSync(path.join(workflowDir, "lint.yml"), workflowContent);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    showHelp();
} else if (args.includes("--version") || args.includes("-v")) {
    console.log(`abap-kit CLI suite v${VERSION}`);
} else if (args[0] === "create") {
    if (!args[1]) {
        log("❌ Error: Target project name parameter is mandatory", "error");
        log("Usage: abap-kit create <project-name>", "info");
        process.exit(1);
    }
    createProject(args[1]).catch((error) => {
        log(`❌ Error: ${error.message}`, "error");
        process.exit(1);
    });

}
else if (args[0] === "ci") {
    const currentDir = process.cwd();
    if (!fs.existsSync(path.join(currentDir, "package.json"))) {
        log("❌ Error: No package.json found. Navigate to an active abap-kit repository directory.", "error");
        process.exit(1);
    }

    log("🚀 Orchestrating GitHub Actions continuous integration pipelines...", "info");
    createGitHubWorkflow(currentDir);
    log("🚀 Automation engine live at .github/workflows/lint.yml", "success");
} else {
    log(`❌ Command unrecognized: ${args[0]}`, "error");
    log("Run 'abap-kit --help' to review usage directives.", "info");
    process.exit(1);
}