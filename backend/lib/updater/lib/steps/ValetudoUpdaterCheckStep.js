const Logger = require("../../../Logger");
const path = require("path/posix");
const stateAttrs = require("../../../entities/state/attributes");
const States = require("../../../entities/core/updater");
const Tools = require("../../../utils/Tools");
const UpdaterUtils = require("../UpdaterUtils");
const uuid = require("uuid");
const ValetudoUpdaterError = require("../ValetudoUpdaterError");
const ValetudoUpdaterStep = require("./ValetudoUpdaterStep");

class ValetudoUpdaterCheckStep extends ValetudoUpdaterStep {
    /**
     * @param {object} options
     * @param {boolean} options.embedded
     * @param {object} options.architectures
     * @param {number} options.spaceRequired
     * @param {import("../../../core/ValetudoRobot")} options.robot
     * @param {import("../update_provider/ValetudoUpdateProvider")} options.updateProvider
     */
    constructor(options) {
        super();

        this.embedded = options.embedded;
        this.architectures = options.architectures;
        this.spaceRequired = options.spaceRequired;

        this.robot = options.robot;
        this.updateProvider = options.updateProvider;
    }

    async execute() {
        const lowmemRequired = Tools.IS_LOWMEM_HOST();
        const archRequired = this.architectures[process.arch];
        const currentVersion = Tools.GET_VALETUDO_VERSION();
        let binaryRequired = `valetudo-${archRequired}${lowmemRequired ? "-lowmem" : ""}${Tools.IS_UPX_COMPRESSED(process.argv0) ? ".upx" : ""}`;

        if (this.embedded !== true) {
            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.NOT_EMBEDDED,
                "Updating is only possible in embedded mode"
            );
        }

        try {
            await this.robot.pollState();
        } catch (e) {
            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.UNKNOWN,
                "Error while polling the robots state"
            );
        }

        const statusAttribute = this.robot.state.getFirstMatchingAttributeByConstructor(
            stateAttrs.StatusStateAttribute
        );

        if (!(statusAttribute && statusAttribute.value === stateAttrs.StatusStateAttribute.VALUE.DOCKED)) {
            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.NOT_DOCKED,
                "Updating is only possible while the robot is docked"
            );
        }


        const downloadPath = UpdaterUtils.getDownloadPath(this.spaceRequired); //Also throws a ValetudoUpdaterError

        let releases;
        try {
            releases = await this.updateProvider.fetchReleases();
        } catch (e) {
            Logger.error("Error while fetching releases", e);

            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.DOWNLOAD_FAILED,
                "Error while fetching releases"
            );
        }

        const releaseToDownload = UpdaterUtils.determineReleaseToDownload(releases, currentVersion);
        if (releaseToDownload.updateRequired === false) {
            let changelog;

            if (releaseToDownload.release.version === currentVersion && releaseToDownload.release.changelog) {
                changelog = releaseToDownload.release.changelog;
            }

            return new States.ValetudoUpdaterNoUpdateRequiredState({
                currentVersion: currentVersion,
                changelog: changelog
            });
        }

        let releaseBinaries;
        try {
            releaseBinaries = await this.updateProvider.fetchBinariesForRelease(releaseToDownload.release);
        } catch (e) {
            Logger.error(`Error while fetching release binaries for ${releaseToDownload.release.version}`, e);

            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.DOWNLOAD_FAILED,
                `Error while fetching release binaries for ${releaseToDownload.release.version}`
            );
        }

        const binaryToUse = releaseBinaries.find(b => {
            return b.name === binaryRequired;
        });

        if (!binaryToUse) {
            throw new ValetudoUpdaterError(
                ValetudoUpdaterError.ERROR_TYPE.NO_MATCHING_BINARY,
                `Release ${releaseToDownload.release.version} doesn't feature a ${binaryRequired} binary.`
            );
        }

        return new States.ValetudoUpdaterApprovalPendingState({
            version: releaseToDownload.release.version,
            releaseTimestamp: releaseToDownload.release.releaseTimestamp,
            changelog: releaseToDownload.release.changelog,
            downloadUrl: binaryToUse.downloadUrl,
            expectedHash: binaryToUse.sha256sum,
            downloadPath: path.join(downloadPath, uuid.v4())
        });
    }
}

module.exports = ValetudoUpdaterCheckStep;
