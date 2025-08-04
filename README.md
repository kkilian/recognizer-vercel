# Card Recognition Trainer

A speed training app for memorizing and recognizing playing cards. Train your memory with timed card recognition exercises.

## 🎴 Features

- **Speed Recognition Training**: Practice recognizing cards as quickly as possible
- **Focus Mode**: Minimalist interface for distraction-free training
- **Session Statistics**: Track your recognition times and progress
- **Progress Charts**: Visualize your improvement over time
- **Customizable Sessions**: Choose number of cards and card suits
- **Keyboard Controls**: Space to advance, ESC to exit

## 🚀 Deployment

### Deploy to Vercel

1. Install Vercel CLI (if not already installed):
```bash
npm install -g vercel
```

2. Deploy the app:
```bash
cd recognizer-vercel
vercel
```

3. Follow the prompts to:
   - Link to your Vercel account
   - Set up the project
   - Deploy to production

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## 🎮 How to Use

1. **Set your preferences**:
   - Number of cards to practice (1-52)
   - Card suits to include
   - Enable Focus Mode for minimal distractions

2. **Start training**:
   - Press SPACE to begin
   - Recognize each card
   - Press SPACE to move to the next card

3. **Review your performance**:
   - See your average, best, and worst times
   - Track your progress over multiple sessions
   - Export your data for analysis

## 🛠️ Technology Stack

- **Frontend**: Pure HTML, CSS, JavaScript
- **Charts**: Chart.js for data visualization
- **Hosting**: Vercel (static site hosting)
- **Storage**: LocalStorage for session persistence

## 📝 License

MIT License

## 🔗 Links

- [Live Demo](https://your-app-name.vercel.app) <!-- Update after deployment -->
- [Main Repository](https://github.com/kkilian/cards)