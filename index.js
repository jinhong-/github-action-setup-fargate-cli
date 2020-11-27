const core = require('@actions/core');
const toolCache = require('@actions/tool-cache');
const os = require('os');


(async () => {
    try {
        await setup();
    } catch (error) {
        core.setFailed(error.message);
    }
})();

async function setup() {
    const cliVersion = core.getInput('cli-version');
    const osPlat = os.platform();
    const osArch = os.arch();

    let fargateCliDirectory = toolCache.find('fargate', cliVersion);

    if (!fargateCliDirectory) {
        const pathToCli = await downloadCli(osPlat, osArch, cliVersion)
        fargateCliDirectory = await toolCache.cacheDir(pathToCli, 'fargate', cliVersion);
    }

    core.addPath(fargateCliDirectory);
}

async function downloadCli(os, arch, version) {
    const downloadUrl = generateDownloadUrl(os, arch, version)

    core.info(`Downloading Fargate CLI from ${downloadUrl}`);
    const pathToCLIZip = await toolCache.downloadTool(downloadUrl);

    core.info('Extracting Fargate CLI zip file');
    const pathToCLI = await toolCache.extractZip(pathToCLIZip);
    core.info(`Fargate CLI path is ${pathToCLI}`);

    if (!pathToCLIZip || !pathToCLI) {
        throw new Error(`Unable to download Fargate CLI from ${url}`);
    }

    return pathToCLI;
}

function generateDownloadUrl(os, arch, version) {
    os = formatOSForUrl(os)
    arch = formatArchForUrl(arch)
    ensureArchCompatibleWithOS(os, arch)

    return `https://github.com/awslabs/fargatecli/releases/download/${version}/fargate-${version}-${os}-${arch}.zip`;
}

function ensureArchCompatibleWithOS(os, arch) {
    const allowedArch = {
        'darwin': ['amd64'],
        'linux': ['386', 'amd64', 'arm'],
        'windows': ['386', 'amd64']
    };

    const arches = allowedArch[os];
    if (!arches || !arches.some(arch => arch == arch)) {
        throw Error(`'os ${os}' does not support arch '${arch}'`)
    }

}

function formatOSForUrl(os) {
    if (os == 'darwin') {
        return os;
    }
    if (os == 'linux') {
        return os;
    }
    if (os == 'win32') {
        return 'windows';
    }

    throw Error(`os value '${os}' is not supported`)
}

function formatArchForUrl(arch) {
    if (arch == 'arm64') {
        return arch;
    }
    if (arch == 'arm') {
        return arch;
    }
    if (arch == 'x32') {
        return '386';
    }

    if (arch == 'x64') {
        return 'amd64';
    }

    throw Error(`arch value '${arch}' is not supported`)
}
