import { Turtle, SimpleTurtle, Point, Color } from "./turtle";
import * as fs from "fs";
import { execSync } from "child_process";

// Function to draw a square
export function drawSquare(turtle: Turtle, sideLength: number): void {
    let count = 0;
    while (count < 4) {
        turtle.forward(sideLength);
        turtle.turn(90);
        count++;
    }
}

// Function to calculate chord length
export function chordLength(radius: number, angleInDegrees: number): number {
    return Math.round(2 * radius * Math.sin((angleInDegrees * Math.PI) / 360) * 100) / 100;
}

// Function to draw an approximate circle
export function drawApproximateCircle(turtle: Turtle, radius: number, numSides: number): void {
    const angle = 360 / numSides;
    const sideLength = chordLength(radius, angle);
    let count = 0;
    while (count < numSides) {
        turtle.forward(sideLength);
        turtle.turn(angle);
        count++;
    }
}

// Function to calculate distance between two points
export function distance(p1: Point, p2: Point): number {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

// Function to find a path (Basic Implementation)
export function findPath(turtle: Turtle, points: Point[]): string[] {
    return points.slice(0, -1).map((p1, i) => {
        let p2 = points[i + 1];
        return `Move from (${p1.x}, ${p1.y}) to (${p2.x}, ${p2.y}), distance: ${distance(p1, p2)}`;
    });
}

// Function to draw personal art
export function drawPersonalArt(turtle: Turtle): void {
    let steps = 36;
    for (let i = 0; i < steps; i++) {
        turtle.forward(100);
        turtle.turn(170);
    }
}

function generateHTML(pathData: { start: Point; end: Point; color: Color }[]): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Turtle Graphics Output</title>
    <style> body { margin: 0; } </style>
</head>
<body>
    <svg width="500" height="500" style="background-color:#f0f0f0;">
        ${pathData.map(({ start, end, color }) =>
            `<line x1="${start.x + 250}" y1="${start.y + 250}" x2="${end.x + 250}" y2="${end.y + 250}" stroke="${color}" stroke-width="2"/>`
        ).join('')}
    </svg>
</body>
</html>`;
}

function saveHTMLToFile(htmlContent: string, filename: string = "output.html"): void {
    fs.writeFileSync(filename, htmlContent);
    console.log(`Drawing saved to ${filename}`);
}

function openHTML(filename: string = "output.html"): void {
    const commands = [`open ${filename}`, `start ${filename}`, `xdg-open ${filename}`];
    for (const cmd of commands) {
        try {
            execSync(cmd);
            return;
        } catch {}
    }
    console.log("Could not open the file automatically");
}

export function main(): void {
    const turtle = new SimpleTurtle();
    drawSquare(turtle, 100);
    drawApproximateCircle(turtle, 50, 36);
    drawPersonalArt(turtle);
    const htmlContent = generateHTML((turtle as SimpleTurtle).getPath());
    saveHTMLToFile(htmlContent);
    openHTML();
}

if (require.main === module) {
    main();
}