// ============================================================
// CUSTOM EVENT MESSAGES CONFIGURATION
// Define your own rules and triggers!
// ============================================================

const CustomEvents = {
    // Enable/disable the entire popup system
    enabled: true,

    // ============================================================
    // CUSTOM RULES
    // Add as many rules as you want!
    // ============================================================
    
    rules: [
        // Example 1: Yahtzee scored
        {
            name: "yahtzee_scored",
            enabled: true,
            condition: (eventData) => {
                return eventData.category === 'yahtzee' && eventData.score === 50;
            },
            messages: [
                "I can't believe you've done this! 🎉",
                "YAHTZEE! Absolutely legendary! 🎲",
                "Five of a kind?! Show off! 😎"
            ],
            selection: "random" // or 0, 1, 2 for specific message
        },

        // Example 2: Total score higher than 300 (even before finishing)
        {
            name: "high_total_score",
            enabled: true,
            condition: (eventData) => {
                return eventData.totalScore > 300;
            },
            messages: [
                "Over 300 points already?! 🔥",
                "{{player}} is absolutely dominating with {{totalScore}} points! 💪"
            ],
            selection: "random"
        },

        // Example 3: Upper section total > 55
        {
            name: "upper_section_over_55",
            enabled: true,
            condition: (eventData) => {
                return eventData.upperSectionTotal > 55;
            },
            messages: [
                "Upper section total: {{upperSectionTotal}}! That's insane! 🎯",
                "How did you get {{upperSectionTotal}} in the upper section?! 😱"
            ],
            selection: "random"
        },

        // Example 4: Second Yahtzee in same game
        {
            name: "second_yahtzee",
            enabled: true,
            condition: (eventData) => {
                return eventData.yahtzeeCount === 2;
            },
            messages: [
                "A SECOND YAHTZEE?! What are the odds?! 🤯",
                "{{player}} just got their 2nd Yahtzee! Unbelievable! 🎊"
            ],
            selection: "random"
        },

        // Example 5: Zero score (failure)
        {
            name: "zero_score",
            enabled: true,
            condition: (eventData) => {
                return eventData.score === 0;
            },
            messages: [
                "Ouch... zero points! 💀",
                "Better luck next time! 😬",
                "We've all been there... 😢"
            ],
            selection: "random"
        },

        // Example 6: Large straight
        {
            name: "large_straight",
            enabled: true,
            condition: (eventData) => {
                return eventData.category === 'large_straight' && eventData.score === 40;
            },
            messages: [
                "Perfect straight! 🎯",
                "1-2-3-4-5 or 2-3-4-5-6... beautiful! ✨"
            ],
            selection: "random"
        },

        // Example 7: Full house
        {
            name: "full_house",
            enabled: true,
            condition: (eventData) => {
                return eventData.category === 'full_house' && eventData.score === 25;
            },
            messages: [
                "Full house! 🏠",
                "Three and two... perfection! 🎭"
            ],
            selection: "random"
        },

        // Example 8: Very high single category score (like 30 in sixes)
        {
            name: "high_single_score",
            enabled: true,
            condition: (eventData) => {
                return eventData.score >= 25 && 
                       ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].includes(eventData.category);
            },
            messages: [
                "{{score}} points in {{category}}?! 🔥",
                "That's a massive {{category}} score! 💎"
            ],
            selection: "random"
        },

        // Example 9: Player takes the lead
        {
            name: "takes_lead",
            enabled: true,
            condition: (eventData) => {
                return eventData.tookLead === true;
            },
            messages: [
                "{{player}} takes the lead! 🥇",
                "We have a new leader! 👑"
            ],
            selection: "random"
        },

        // Example 10: Close game at the end
        {
            name: "close_game",
            enabled: true,
            condition: (eventData) => {
                return eventData.gameOver && eventData.margin <= 10;
            },
            messages: [
                "Only {{margin}} points apart! What a game! 😱",
                "That was nail-bitingly close! 🤏"
            ],
            selection: "random"
        },

        // Example 11: Landslide victory
        {
            name: "landslide",
            enabled: true,
            condition: (eventData) => {
                return eventData.gameOver && eventData.margin >= 50;
            },
            messages: [
                "{{margin}} point victory! Total domination! 💪",
                "That wasn't even close! 😂"
            ],
            selection: "random"
        },

        // Example 12: First roll of the game
        {
            name: "first_roll",
            enabled: true,
            triggerOnce: true, // Only trigger once per game
            condition: (eventData) => {
                return eventData.isFirstRoll === true;
            },
            messages: [
                "Let the games begin! 🎮",
                "And they're off! 🏁"
            ],
            selection: "random"
        },

        // Example 13: Final category
        {
            name: "final_category",
            enabled: true,
            condition: (eventData) => {
                return eventData.categoriesRemaining === 1;
            },
            messages: [
                "Final category! Make it count! 🎯",
                "This is it - last chance! 💫"
            ],
            selection: "random"
        },

        // Example 14: Player-specific rule
        {
            name: "bob_yahtzee",
            enabled: true,
            condition: (eventData) => {
                return eventData.player === "Bob" && 
                       eventData.category === 'yahtzee' && 
                       eventData.score === 50;
            },
            messages: [
                "Bob got a Yahtzee?! The world is ending! 😱"
            ],
            selection: 0
        },

        // Example 15: Instant Yahtzee (first roll)
        {
            name: "instant_yahtzee",
            enabled: true,
            condition: (eventData) => {
                return eventData.rollNumber === 1 && 
                       eventData.category === 'yahtzee' && 
                       eventData.score === 50;
            },
            messages: [
                "YAHTZEE ON THE FIRST ROLL?! 🤯",
                "Instant Yahtzee! What are the chances?! 🎲"
            ],
            selection: "random"
        },

        // ============================================================
        // ADD YOUR OWN RULES HERE!
        // ============================================================
        
        /*
        Template for adding new rules:
        
        {
            name: "my_custom_rule",
            enabled: true,
            condition: (eventData) => {
                // Write your condition here
                // Return true to trigger the popup
                return eventData.score > 100;
            },
            messages: [
                "Your custom message here!",
                "Another message option!"
            ],
            selection: "random"
        },
        */
    ]
};

// ============================================================
// POPUP DISPLAY SETTINGS
// ============================================================

const PopupSettings = {
    // How long the popup stays on screen (milliseconds)
    duration: 3000,
    
    // Animation style: 'fade', 'bounce', 'slide', 'zoom'
    animation: 'bounce',
    
    // Position: 'top', 'center', 'bottom'
    position: 'center',
    
    // Allow multiple popups to queue
    allowQueue: true,
    
    // Maximum queued popups (prevents spam)
    maxQueue: 3
};

// ============================================================
// AVAILABLE EVENT DATA
// ============================================================

/*
When a rule is checked, eventData contains:

ALWAYS AVAILABLE:
- player: string               // Player's name (e.g., "Alice")
- totalScore: number           // Player's current total score
- upperSectionTotal: number    // Sum of ones through sixes
- categoriesRemaining: number  // How many categories left to fill

WHEN SCORING:
- category: string            // Category being scored (e.g., "yahtzee", "ones")
- score: number              // Points scored in this turn
- rollNumber: number         // Which roll (1, 2, or 3) was used to score
- dice: array                // The five dice values [1-6]

SPECIAL COUNTS:
- yahtzeeCount: number       // How many Yahtzees this player has scored
- straightCount: number      // How many straights (small + large)

GAME STATE:
- isFirstRoll: boolean       // True if this is the very first roll of the game
- gameOver: boolean          // True when game has ended
- margin: number             // Point difference between 1st and 2nd place (game over only)
- tookLead: boolean          // True if player just took first place

ADVANCED:
- allScores: object          // All of player's scores { ones: 3, twos: 6, ... }
- upperBonus: number         // Upper section bonus (0 or 35)

EXAMPLES:
- Check if score > 20:        eventData.score > 20
- Check for Yahtzee:          eventData.category === 'yahtzee' && eventData.score === 50
- Check player name:          eventData.player === "Bob"
- Check total score:          eventData.totalScore > 300
- Check upper section:        eventData.upperSectionTotal > 55
- Check second Yahtzee:       eventData.yahtzeeCount === 2
- Multiple conditions:        eventData.player === "Alice" && eventData.score === 50
*/

// ============================================================
// MESSAGE PLACEHOLDERS
// ============================================================

/*
Use these in your messages - they'll be replaced automatically:

{{player}}              - Player's name
{{score}}               - Score for this turn
{{totalScore}}          - Player's total score
{{category}}            - Category name (prettier format)
{{upperSectionTotal}}   - Upper section total
{{yahtzeeCount}}        - Number of Yahtzees scored
{{margin}}              - Point difference (game over)
{{categoriesRemaining}} - Categories left to score

EXAMPLE:
"{{player}} scored {{score}} points in {{category}}!"
becomes:
"Alice scored 50 points in Yahtzee!"
*/
