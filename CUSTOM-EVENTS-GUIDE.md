# 🎉 Custom Events System - Rule-Based Configuration

Your LOSH Yahtzee now has a **super flexible rule-based popup system**! You can create any custom condition you want.

## 🚀 How It Works

Instead of pre-defined events, you write **rules with conditions**. If the condition is true, the popup appears!

## 📝 Quick Example

```javascript
{
    name: "yahtzee_scored",
    enabled: true,
    condition: (eventData) => {
        return eventData.category === 'yahtzee' && eventData.score === 50;
    },
    messages: [
        "I can't believe you've done this! 🎉"
    ],
    selection: "random"
}
```

**Translation:** "If someone scores a Yahtzee (50 points), show this message"

## 🎯 Your Examples Implemented

### Example 1: Yahtzee Scored
```javascript
{
    name: "yahtzee_scored",
    enabled: true,
    condition: (eventData) => {
        return eventData.category === 'yahtzee' && eventData.score === 50;
    },
    messages: ["I can't believe you've done this! 🎉"]
}
```

### Example 2: Score Higher than 300
```javascript
{
    name: "high_total_score",
    enabled: true,
    condition: (eventData) => {
        return eventData.totalScore > 300;
    },
    messages: [
        "Over 300 points already?! 🔥",
        "{{player}} has {{totalScore}} points! 💪"
    ]
}
```

### Example 3: Upper Section > 55
```javascript
{
    name: "upper_section_over_55",
    enabled: true,
    condition: (eventData) => {
        return eventData.upperSectionTotal > 55;
    },
    messages: [
        "Upper section: {{upperSectionTotal}}! Insane! 🎯"
    ]
}
```

### Example 4: Second Yahtzee
```javascript
{
    name: "second_yahtzee",
    enabled: true,
    condition: (eventData) => {
        return eventData.yahtzeeCount === 2;
    },
    messages: [
        "A SECOND YAHTZEE?! 🤯"
    ]
}
```

## 📊 Available Data

When writing conditions, you have access to:

### Always Available
- `eventData.player` - Player's name
- `eventData.totalScore` - Current total score
- `eventData.upperSectionTotal` - Sum of ones through sixes
- `eventData.categoriesRemaining` - Categories left to fill

### When Scoring
- `eventData.category` - What they're scoring (e.g., "yahtzee")
- `eventData.score` - Points scored this turn
- `eventData.rollNumber` - Which roll (1, 2, or 3)
- `eventData.dice` - Array of dice values [1-6]

### Special Counts
- `eventData.yahtzeeCount` - Total Yahtzees this game
- `eventData.straightCount` - Total straights

### Game State
- `eventData.isFirstRoll` - True for first roll of game
- `eventData.gameOver` - True when game ends
- `eventData.margin` - Point difference (game over)
- `eventData.tookLead` - True if just took first place

## 💡 More Examples

### High Single Score (30 in Sixes)
```javascript
{
    name: "high_single_score",
    enabled: true,
    condition: (eventData) => {
        const upperCategories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
        return eventData.score >= 25 && upperCategories.includes(eventData.category);
    },
    messages: [
        "{{score}} points in {{category}}?! 🔥"
    ]
}
```

### Player-Specific (Bob gets Yahtzee)
```javascript
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
    ]
}
```

### Instant Yahtzee (First Roll)
```javascript
{
    name: "instant_yahtzee",
    enabled: true,
    condition: (eventData) => {
        return eventData.rollNumber === 1 && 
               eventData.category === 'yahtzee';
    },
    messages: [
        "YAHTZEE ON THE FIRST ROLL?! 🤯"
    ]
}
```

### Player Takes the Lead
```javascript
{
    name: "takes_lead",
    enabled: true,
    condition: (eventData) => {
        return eventData.tookLead === true;
    },
    messages: [
        "{{player}} takes the lead! 🥇"
    ]
}
```

### Close Game Ending
```javascript
{
    name: "close_game",
    enabled: true,
    condition: (eventData) => {
        return eventData.gameOver && eventData.margin <= 10;
    },
    messages: [
        "Only {{margin}} points apart! 😱"
    ]
}
```

### Massive Victory
```javascript
{
    name: "landslide",
    enabled: true,
    condition: (eventData) => {
        return eventData.gameOver && eventData.margin >= 50;
    },
    messages: [
        "{{margin}} point victory! Domination! 💪"
    ]
}
```

### Specific Score Range
```javascript
{
    name: "score_200_to_250",
    enabled: true,
    condition: (eventData) => {
        return eventData.totalScore >= 200 && eventData.totalScore <= 250;
    },
    messages: [
        "{{player}} is in the sweet spot! 🎯"
    ]
}
```

### Multiple Conditions
```javascript
{
    name: "alice_high_upper",
    enabled: true,
    condition: (eventData) => {
        return eventData.player === "Alice" && 
               eventData.upperSectionTotal > 60 &&
               eventData.categoriesRemaining < 5;
    },
    messages: [
        "Alice is crushing it with {{upperSectionTotal}} in upper! 👑"
    ]
}
```

## 🎨 Message Placeholders

Use these in your messages - they auto-replace:

- `{{player}}` - Player's name
- `{{score}}` - Score this turn
- `{{totalScore}}` - Total score
- `{{category}}` - Category name (pretty format)
- `{{upperSectionTotal}}` - Upper section total
- `{{yahtzeeCount}}` - Number of Yahtzees
- `{{margin}}` - Point difference
- `{{categoriesRemaining}}` - Categories left

## ⚙️ Rule Options

### Message Selection
```javascript
selection: "random"     // Pick random message
selection: 0           // Always first message
selection: 1           // Always second message
```

### Trigger Once
```javascript
triggerOnce: true      // Only trigger once per game
```

### Enable/Disable
```javascript
enabled: true          // Turn on
enabled: false         // Turn off
```

## 🎪 Advanced Examples

### Zero Points 3 Times
```javascript
// First, track zeros in your rule
{
    name: "third_zero",
    enabled: true,
    condition: (eventData) => {
        // Count zeros in allScores
        const zeros = Object.values(eventData.allScores).filter(s => s === 0).length;
        return zeros === 3;
    },
    messages: ["Three zeros?! Ouch! 😬"]
}
```

### Perfect Upper Section (All Max)
```javascript
{
    name: "perfect_upper",
    enabled: true,
    condition: (eventData) => {
        const s = eventData.allScores;
        return s.ones === 5 && s.twos === 10 && s.threes === 15 && 
               s.fours === 20 && s.fives === 25 && s.sixes === 30;
    },
    messages: ["PERFECT UPPER SECTION! 🏆"]
}
```

### All Straights Completed
```javascript
{
    name: "both_straights",
    enabled: true,
    condition: (eventData) => {
        return eventData.allScores.small_straight > 0 && 
               eventData.allScores.large_straight > 0;
    },
    messages: ["Got both straights! 📏"]
}
```

## 🛠️ Popup Settings

Customize appearance:

```javascript
const PopupSettings = {
    duration: 3000,        // 3 seconds
    animation: 'bounce',   // 'fade', 'bounce', 'slide', 'zoom'
    position: 'center',    // 'top', 'center', 'bottom'
    allowQueue: true,      // Stack multiple popups
    maxQueue: 3           // Max 3 at once
}
```

## 📖 How to Add Your Own Rule

1. Open `custom-events.js`
2. Find the `rules:` array
3. Add your rule at the end:

```javascript
{
    name: "my_custom_rule",
    enabled: true,
    condition: (eventData) => {
        // Your condition here
        return eventData.totalScore > 150;
    },
    messages: [
        "Your custom message! 🎉"
    ],
    selection: "random"
},
```

4. Save and reload the game!

## 🎯 Rule Template

Copy this template to add new rules:

```javascript
{
    name: "rule_name_here",
    enabled: true,
    triggerOnce: false,  // Optional: set to true for one-time events
    condition: (eventData) => {
        // Write your condition
        // Must return true or false
        return eventData.score > 20;
    },
    messages: [
        "Message 1",
        "Message 2 with {{player}}'s name",
        "Message 3 with {{score}} points"
    ],
    selection: "random"  // or 0, 1, 2 for specific message
},
```

## 🐛 Debugging

**Popup not showing?**
1. Check `CustomEvents.enabled = true` at top
2. Check specific rule has `enabled: true`
3. Open browser console (F12) - errors show there
4. Test your condition: `console.log(eventData)` inside condition

**Condition not working?**
```javascript
condition: (eventData) => {
    console.log("Score:", eventData.score);  // Debug line
    console.log("Category:", eventData.category);  // Debug line
    return eventData.score > 20;
}
```

## ✨ Pro Tips

1. **Keep conditions simple** - Complex logic can cause errors
2. **Test one rule at a time** - Enable one, test, then add more
3. **Use console.log** - Debug by logging eventData
4. **Check the examples** - 15+ working examples in the file
5. **Disable unused rules** - Set `enabled: false` instead of deleting

## 🎉 Fun Ideas

- Popup when someone's losing badly
- Celebration for comeback victory
- Taunt when using Chance poorly
- Congratulations on first Yahtzee ever
- Warning when falling behind
- Encouragement after bad roll
- Shock at lucky first roll
- Rivalry messages between specific players

---

**Have fun creating custom popups! 🎲**

The sky's the limit - you can create ANY condition you can think of!
