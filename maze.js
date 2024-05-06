const size_inset_ratio = 10

class Maze {
    constructor (ctx) {
        this.maze_size = clamp(parseInt(document.getElementById("maze-size").value), 5, 20);
        document.getElementById("maze-size").value = this.maze_size;

        this.num_walls = clamp(parseInt(document.getElementById("num-walls").value), 0, Math.min(Math.floor((this.maze_size * this.maze_size) / 3), 100));
        document.getElementById("num-walls").value = this.num_walls;

        this.num_pits = clamp(parseInt(document.getElementById("num-pits").value), 0, Math.min(Math.floor((this.maze_size * this.maze_size) / 3), 100));
        document.getElementById("num-pits").value = this.num_pits;

        let canvas_size = ctx.canvas.height;
        this.pixel_ratio = canvas_size / (1 + this.maze_size * (size_inset_ratio + 1));

        this.random_maze();
    }

    get_size() {
        return this.maze_size;
    }
    
    get_cell_pixel_size() {
        return this.pixel_ratio * size_inset_ratio;
    }

    get_cell_pixel_origin([y, x]) {
        let px_y = this.pixel_ratio + y * (this.pixel_ratio + this.pixel_ratio * size_inset_ratio)
        let px_x = this.pixel_ratio + x * (this.pixel_ratio + this.pixel_ratio * size_inset_ratio)

        return [px_y, px_x]
    }

    get_cell_pixel_center([y, x]) {
        origin = this.get_cell_pixel_origin([y, x]);
        let half = (this.pixel_ratio * size_inset_ratio) / 2;

        origin[0] = origin[0] + half;
        origin[1] = origin[1] + half;

        return origin;
    }

    get_state_type ([y, x]) {
        // In the case that the given coordinates are out of bounds, return the state as a wall
        if (y < 0 || x < 0 || y >= this.maze_size || x >= this.maze_size) {
            return 'wall'
        }
        
        switch(this.state_grid[y][x]){
            case 0:
                return 'path'
            case 1:
                return 'wall'
            case 2:
                return 'pit'
            case 3:
                return 'path'
            case 4:
                return 'goal'
        }

        return 'ERROR'
    }

    get_origin_cell () {
        return this.origin_coordinates;
    }

    

    // Creates a random maze
    random_maze () {
        // Initialize a new grid and fill it with path cells -> 0
        this.state_grid = [];
        
        for (let i = 0; i < this.maze_size; i++) {
            let row = [];
            
            for (let j = 0; j < this.maze_size; j++) {
                row.push(0);
            }

            this.state_grid.push(row);
        }

        // Add some random walls -> 1
        let walls = this.num_walls;
        while (walls !== 0) {
            let y = randomInt(this.maze_size)
            let x = randomInt(this.maze_size)

            if (this.state_grid[y][x] === 0) {
                this.state_grid[y][x] = 1;
                walls--;
            }
        }

        // Add some random pits -> 2
        let pits = this.num_pits;
        while (pits !== 0) {
            let y = randomInt(this.maze_size)
            let x = randomInt(this.maze_size)

            if (this.state_grid[y][x] === 0) {
                this.state_grid[y][x] = 2;
                pits--;
            }
        }

        //Place origin on a rand in 2nd quadrant -> 3
        let found = false
        while (!found) {
            let y = randomInt((this.maze_size / 2))
            let x = randomInt((this.maze_size / 2))

            if (this.state_grid[y][x] === 0) {
                this.state_grid[y][x] = 3;
                found = true;

                this.origin_coordinates = [y, x]
            }
        }

        //Place goal in 4th quadrant -> 4
        found = false
        while (!found) {
            let y = randomInt(Math.round(this.maze_size / 2)) + Math.floor(this.maze_size / 2)
            let x = randomInt(Math.round(this.maze_size / 2)) + Math.floor(this.maze_size / 2)

            if (this.state_grid[y][x] === 0) {
                this.state_grid[y][x] = 4;
                found = true;

                this.goal_coordinates = [y, x]
            }
        }
    }

    // Draw the grid of states
    draw (ctx, game_engine) {
        for (let i = 0; i < this.maze_size; i++) {
            for (let j = 0; j < this.maze_size; j++) {
                
                // Pick a fill style based on the state of the current cell
                switch (this.state_grid[i][j]) {
                    case 0:
                        ctx.fillStyle = rgba(100, 255, 255, 0.8)    // Path -> Light Blue
                        break;
                    case 1:
                        ctx.fillStyle = "black"                     // Wall -> Black
                        break;
                    case 2:
                        ctx.fillStyle = "red"                       // Pit -> Red
                        break;
                    case 3:
                        ctx.fillStyle = rgba(0, 255, 100, 0.25)     // Origin -> ???
                        break;
                    case 4:
                        ctx.fillStyle = "green"                     // Goal -> Green
                        break;
                }

                //console.log(`${i}, ${j}, ${ctx.fillStyle}`)

                let [y, x] = this.get_cell_pixel_origin([i, j]);
                let cell_size = this.get_cell_pixel_size()
                ctx.fillRect(y, x, cell_size, cell_size)
            }
        }
    }

    // No updates needed
    update () {

    }
}


// Ice lake should be a square grid, where each position is of one of 4 types: {Path, Pit, Wall, Goal}
// The 'state' of each cell is a list of its y and x coordinates: [y-coordinate, x-coordinate]
// Each cell should have a 'reward' value that is determined by their type {Path: 0, Pit: -100, Wall: None, Goal: 100}
// The 'Pit' and 'Goal' states are terminating states
// There should be an origin cell