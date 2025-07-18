import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const BacklogChart = ({ backlogData }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const data = {
    labels: ['Passed Courses', 'Failed Courses', 'Pending Courses'],
    datasets: [
      {
        data: [
          backlogData?.passed || 0,
          backlogData?.failed || 0,
          backlogData?.pending || 0
        ],
        backgroundColor: [
          'var(--chart-passed)',
          'var(--chart-failed)',
          'var(--chart-pending)'
        ],
        borderColor: [
          'var(--chart-passed)',
          'var(--chart-failed)',
          'var(--chart-pending)'
        ],
        borderWidth: 2,
        hoverBorderWidth: 4,
        cutout: '60%',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'var(--primary-text)',
          font: {
            size: 14,
            family: 'Inter'
          },
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'var(--tertiary-bg)',
        titleColor: 'var(--primary-text)',
        bodyColor: 'var(--secondary-text)',
        borderColor: 'var(--border-color)',
        borderWidth: 1
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000
    }
  };

  const totalCourses = (backlogData?.passed || 0) + (backlogData?.failed || 0) + (backlogData?.pending || 0);
  const passPercentage = totalCourses > 0 ? Math.round((backlogData?.passed || 0) / totalCourses * 100) : 0;

  return (
    <motion.div 
      className="backlog-chart-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="chart-header">
        <h3 className="chart-title">📊 Your Academic Progress</h3>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-value">{passPercentage}%</span>
            <span className="stat-label">Completion Rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{backlogData?.failed || 0}</span>
            <span className="stat-label">Backlogs</span>
          </div>
        </div>
      </div>
      
      <div className="chart-wrapper">
        <Doughnut data={data} options={options} />
        <div className="chart-center">
          <motion.div 
            className="center-content"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <span className="total-courses">{totalCourses}</span>
            <span className="courses-label">Total Courses</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default BacklogChart;
