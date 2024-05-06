
// 
//const ticks_per_step = 30;

//const learning_rate = 0.1;
//const discount_rate = 0.1;

// Rewards
const path_reward = -1;
const pit_reward = -100;
const goal_reward = 100;

// Epsilon
//const steps_per_epsilon_decay = 100;
//const epsilon_decay = 0.05;

// Other
const explorer = true;

class Agent {
    constructor(maze) {
        this.maze = maze;

        this.state = this.maze.get_origin_cell();

        this.tick_count = 0;
        this.step_count = 0;

        this.q_table = {};

        this.epsilon = 1.0;

        this.learning_rate = clamp(parseFloat(document.getElementById("learning-rate").value), 0, 1);
        document.getElementById("learning-rate").value = this.learning_rate;

        this.discount_rate = clamp(parseFloat(document.getElementById("discount-rate").value), 0, 1);
        document.getElementById("discount-rate").value = this.discount_rate;

        this.steps_per_epsilon_decay = parseInt(document.getElementById("steps-per-decay").value);
        //document.getElementById("steps")

        this.epsilon_decay_amount = clamp(parseFloat(document.getElementById("decay-amt").value), 0, 1);
    }

    // Q(state, action) = (1 - alpha) * Q(state, action) + alpha * (reward + gamma * max([Q(new_state, action) for action in new_state.actions]))
    // alpha is the learning rate: [0, 1]
    // gamma is the discount rate: [0, 1]
    // reward is the reward for performing the action in the current state(the reward associated with new_state)
    // new_state is the resulting state from performing the action

    bellman(state_old, action, state_new) {
        //Find reward value of new state
        let state_type = this.maze.get_state_type(state_new)
        let reward = 0;
        switch(state_type) {
            case "path":
                reward = path_reward;
                break;
            case "pit":
                reward = pit_reward;
                break;
            case "goal":
                reward = goal_reward;
                break;
        }

        let max_q = Math.max(this.q_value(state_new, 0), this.q_value(state_new, 1), this.q_value(state_new, 2), this.q_value(state_new, 3));

        let bellman_q = (1 - this.learning_rate) * this.q_value(state_old, action) + this.learning_rate * (reward + this.discount_rate * max_q);
        
        let key = this.get_key(state_old, action);

        this.q_table[key] = bellman_q;

        //return bellman_q;
    }

    q_value(state, a) {
        let key = this.get_key(state, a);

        if (!(key in this.q_table)) {
            return 0;
        }

        return this.q_table[key];
    }

    get_key([y, x], a) {
        return `${y}-${x}-${a}`;
    }

    // Use the agent's current state to draw on the proper cell
    draw(ctx, game_engine) {
        // Draw agent on current position
        let [y, x] = this.maze.get_cell_pixel_center(this.state);

        ctx.fillStyle = "Purple";

        ctx.beginPath();
        ctx.arc(y, x, this.maze.pixel_ratio * 2, 0, Math.PI * 2); // x, y, radius, startAngle, endAngle
        ctx.fill();
        ctx.closePath();

        // Draw all learned q-Values
        if (!document.getElementById("q-values").checked) {
            return;
        }

        //Create a font of sans serif and a font size that is 1/5 the pixel height of a cell in the maze
        let font_size = this.maze.get_cell_pixel_size() / 5;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${font_size}px Arial`;
        ctx.fillStyle = 'black';


        //maze_size = this.maze.get_size();
        let pivot_px = this.maze.get_cell_pixel_size() / 4;
        
        for (let i = 0; i < this.maze.maze_size; i++) {
            for (let j = 0; j < this.maze.maze_size; j++) {
                let cell_state_type = this.maze.get_state_type([i, j]);

                if (cell_state_type === "pit" || cell_state_type === "goal") continue;


                let [y_px, x_px] = this.maze.get_cell_pixel_center([i, j])

                ctx.fillText(Math.round(this.q_value([i, j], 0)), y_px - pivot_px, x_px);
                ctx.fillText(Math.round(this.q_value([i, j], 1)), y_px, x_px + pivot_px);
                ctx.fillText(Math.round(this.q_value([i, j], 2)), y_px + pivot_px, x_px);
                ctx.fillText(Math.round(this.q_value([i, j], 3)), y_px, x_px - pivot_px);
            }
        }

        
    }

    // Choose an action to take and update the Q-value of the state-action pair of the taken action
    update() {
        // Only update every few ticks
        if (this.tick_count++ < (60 - parseInt(document.getElementById("agent-speed").value))) {
            return;
        }

        this.tick_count = 0;
        this.step_count++;
        
        // Check if the current state of the agent is a terminating state
        let state_type = this.maze.get_state_type(this.state)
        if (state_type === 'goal' || state_type === 'pit') {
            this.state = this.maze.get_origin_cell();
            return;
        }
        
        // Choose an action based on current epsilon value and the Q-values of the available actions
        let action = -1;
        if (Math.random() < this.epsilon) {
            // !!! If the agent is an explorer, check if any are unexplored and pick one of those !!!

            if (document.getElementById("explorer").checked) {
                let action_list = []
                for (let a = 0; a < 4; a++) {
                    let key = this.get_key(this.state, a)
                    if (!(key in this.q_table)) {
                        action_list.push(a);
                    }
                }

                if (action_list.length === 0) {
                    action = randomInt(4);
                }

                else {
                    action = action_list[randomInt(action_list.length)];
                }
            }

            else {
                action = randomInt(4);
            }
        }

        else {
            let max = Number.NEGATIVE_INFINITY;
            for (let a = 0; a < 4; a++) {
                if (max < this.q_value(this.state, a)) {
                    max = this.q_value(this.state, a);
                    action = a;
                }
                
            }
        }

        let attempted_action = action;
        //Do an icy check and change the action
        if (document.getElementById("icy").checked) {
            if (Math.random() <= parseFloat(document.getElementById("slip-chance").value)) {
                action = (action + (1 + randomInt(2) * 2)) % 4;
            }
        }

        // Save the chosen state-action pair to update Q-value after action
        let old_state = this.state;

        // Do action
        let new_state = Array.from(old_state);

        switch(action) {
            case 0:
                new_state[0]--;
                break;
            case 1:
                new_state[1]++;
                break;
            case 2:
                new_state[0]++;
                break;
            case 3:
                new_state[1]--;
                break;
        }

        if (this.maze.get_state_type(new_state) === "wall") {
            new_state = old_state;
        }

        this.state = new_state;

        // Update the Q-value of the saved state-action pair using values from the new state
        this.bellman(old_state, attempted_action, new_state);

        // Decay epsilon value
        if (this.epsilon > 0 && this.step_count % this.steps_per_epsilon_decay + 1 === this.steps_per_epsilon_decay) {
            this.epsilon -= this.epsilon_decay_amount;

            this.epsilon = Math.max(this.epsilon, 0);

            document.getElementById("epsilon-display").textContent = `epsilon: ${this.epsilon.toFixed(2)}`
        }
    }
}



// We update the q-value when the agent performs the specified action


// User Interface Config Variables
// - Epsilon Decay
//  + Ticks per decay
//  + Decay amount
// - Learning Rate
// - Discount Rate