const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.init(ctx);

	gameEngine.start();
});

const beginSimulation = () => {
	gameEngine.entities = [];
	
	let maze = new Maze(gameEngine.ctx);
	let agent = new Agent(maze);

	gameEngine.addEntity(agent);
	gameEngine.addEntity(maze);
}
