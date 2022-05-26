function mergeAndSortCategories(merges, fixes, commits) {
    const allCommits = [
        ...merges.map(merge => merge.commit),
        ...fixes.map(merge => merge.commit),
        ...commits
    ];

    allCommits.forEach(commit => {
        commit.breaking = /^[A-Za-z0-9.]+!(?:\(.*\))?:/.test(commit.subject);
    })

    return allCommits.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
}

module.exports = function (Handlebars) {
    Handlebars.registerHelper('get-all-non-breaking-commits', function (merges, fixes, commits) {
        return mergeAndSortCategories(merges, fixes, commits).filter(c => c.breaking === false);
    })

    Handlebars.registerHelper('get-all-breaking-commits', function (merges, fixes, commits) {
        return mergeAndSortCategories(merges, fixes, commits).filter(c => c.breaking === true);
    })
    
    Handlebars.registerHelper("render-ccm", function(subject) {
        const match = /^(?<type>[A-Za-z0-9.]+)(?<breaking>!)?(?:\((?<scope>[A-Za-z0-9.]+)\))?: (?<message>.*)$/.exec(subject);
        
        if (typeof match?.groups?.type === "string" && typeof match?.groups?.message === "string") {
            let output = match.groups.message;
            
            if (typeof match.groups.scope === "string") {
                output = `**${match.groups.scope}**: ${output}`;
            }
            
            return output;
        } else {
            return subject;
        }
    })
}