const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownItAnchor = require("markdown-it-anchor");
const path = require("path");

function extractHeadings(html) {
    const headings = [];
    const re = /<h2[^>]*id=["']([^"']*)["'][^>]*>([\s\S]*?)<\/h2>/gi;
    let match;
    while ((match = re.exec(html)) !== null) {
        const text = match[2].replace(/<[^>]+>/g, "").trim();
        if (text) {
            headings.push({ id: match[1], text: text });
        }
    }
    return headings;
}

function buildTocHtml(headings, pageUrl) {
    if (headings.length === 0) return "";
    let html = '<div class="toc">';
    html += "<strong>Table of Contents</strong>";
    html += "<ol>";
    for (const h of headings) {
        html += `<li><a href="${pageUrl}#${h.id}">${h.text}</a></li>`;
    }
    html += "</ol></div>";
    return html;
}

module.exports = function (eleventyConfig) {
    const markdownIt = require("markdown-it")({
        html: true,
        linkify: true,
    });

    markdownIt.use(markdownItAnchor, {
        slugify: function (s) {
            return encodeURIComponent(
                s.toLowerCase()
                    .replace(/[^\w\s-]/g, "")
                    .trim()
                    .replace(/[\s]+/g, "-")
            );
        }
    });

    eleventyConfig.setLibrary("md", markdownIt);
    eleventyConfig.addGlobalData("layout", "base.njk");

    eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
    eleventyConfig.addPlugin(syntaxHighlight, {
        preAttributes: { tabindex: 0 },
    });

    eleventyConfig.addFilter("extractHeadings", function (html) {
        return extractHeadings(html);
    });

    eleventyConfig.addTransform("toc", function (content, outputPath) {
        if (!outputPath || !outputPath.endsWith(".html")) return content;
        if (!content.includes("<!-- toc -->")) return content;

        const headings = extractHeadings(content);
        const tocHtml = buildTocHtml(headings, this.page.url);
        return content.replace("<!-- toc -->", tocHtml);
    });
    
    eleventyConfig.addCollection("pages", function (collectionApi) {
        return collectionApi.getFilteredByGlob("pages/**/*.md").sort((a, b) => {
            const catCompare = (a.data.category || "").localeCompare(b.data.category || "");
            if (catCompare !== 0) return catCompare;
            return (a.data.order || 0) - (b.data.order || 0);
        });
    });

    eleventyConfig.addPairedShortcode("alert", function (content, type) {
        const labels = {
            note: "Note",
            tip: "Tip",
            warning: "Warning",
            important: "Important",
        };
        const label = labels[type] || "Note";

        const renderedContent = markdownIt.render(content.trim());

        return `<div class="alert alert-${type}" role="alert"><strong>${label}:</strong><div class="alert-body">${renderedContent}</div></div>`;
    });
    
    eleventyConfig.addPassthroughCopy("assets");
    eleventyConfig.addPassthroughCopy("img");
    eleventyConfig.addPassthroughCopy("favicon.ico");
    eleventyConfig.addPassthroughCopy("apple-touch-icon.png");
    eleventyConfig.addPassthroughCopy("android-chrome-*");
    
    eleventyConfig.addPassthroughCopy("pages/**/img");
    
    const fontSansPath = path.dirname(require.resolve("@fontsource/ibm-plex-sans/package.json"));
    const fontMonoPath = path.dirname(require.resolve("@fontsource/ibm-plex-mono/package.json"));

    eleventyConfig.addPassthroughCopy({
        [fontSansPath]: "assets/fonts/ibm-plex-sans",
        [fontMonoPath]: "assets/fonts/ibm-plex-mono",
    });

    eleventyConfig.setLiquidOptions({
        dynamicPartials: false,
    });

    eleventyConfig.addGlobalData("buildTime", () => Date.now());

    return {
        dir: {
            input: ".",
            output: "dist",
            includes: "_includes",
            layouts: "_includes/layouts",
        },
        htmlTemplateEngine: "liquid",
        markdownTemplateEngine: "liquid",
    };
};