import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '0min', average: 20, focusSpark: 25 },
  { time: '5min', average: 35, focusSpark: 60 },
  { time: '10min', average: 50, focusSpark: 85 },
  { time: '15min', average: 60, focusSpark: 95 },
  { time: '20min', average: 65, focusSpark: 100 },
  { time: '25min', average: 70, focusSpark: 100 },
];

export function ProblemSolution() {
  return (
    <section className="py-20 px-6 lg:px-20 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl mb-6 text-foreground">
              Achieve deep study in <span className="gradient-text">minutes</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-lg">
              Get in the zone faster with adaptive focus and science-backed motivation.
            </p>
          </motion.div>

          {/* Right Chart */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-card border border-border rounded-2xl p-8 glow-blue-purple"
          >
            <div className="mb-6">
              <h3 className="text-2xl mb-2 text-foreground">119% Productivity Increase</h3>
              <p className="text-muted-foreground">Average Study vs FocusSpark AI</p>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  stroke="#B0B8C4"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#B0B8C4"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1F2A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#B0B8C4"
                  strokeWidth={2}
                  name="Average Study"
                  dot={{ fill: '#B0B8C4', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="focusSpark"
                  stroke="url(#gradient)"
                  strokeWidth={3}
                  name="FocusSpark AI"
                  dot={{ fill: '#8b5cf6', r: 5 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
