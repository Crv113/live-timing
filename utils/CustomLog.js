function customLog(message) {
    const stack = new Error().stack;
    const stackLines = stack.split('\n');

    // La troisième ligne de la stack contient généralement l'information de l'appel
    const callerLine = stackLines[2];
    const lineNumber = callerLine.match(/(?:at\s.*\()?(.*):(\d+):(\d+)\)?/)[2];
    const datetime = new Date();

    const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
    
    console.log(`[${datetime.toLocaleDateString("fr-FR")} ${datetime.toLocaleTimeString("fr-FR")}][:${lineNumber}]: ${formattedMessage}`);
}

module.exports = {
    customLog,
}