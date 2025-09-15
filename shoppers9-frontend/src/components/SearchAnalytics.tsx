import React, { useState, useEffect } from 'react';
import { TrendingUp, Search, Users, Clock, BarChart3, Eye } from 'lucide-react';
import { searchService } from '../services/searchService';

interface SearchAnalyticsData {
  totalSearches: number;
  uniqueSearchers: number;
  averageSearchTime: number;
  topSearches: Array<{
    query: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  searchConversionRate: number;
  noResultsRate: number;
  popularFilters: Array<{
    name: string;
    usage: number;
  }>;
  searchTrends: Array<{
    date: string;
    searches: number;
    conversions: number;
  }>;
}

interface SearchAnalyticsProps {
  className?: string;
  timeRange?: '7d' | '30d' | '90d';
}

const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({
  className = '',
  timeRange = '30d'
}) => {
  const [analyticsData, setAnalyticsData] = useState<SearchAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await searchService.getSearchAnalytics();
      
      // Mock data for demonstration
      const mockData: SearchAnalyticsData = {
        totalSearches: 15420,
        uniqueSearchers: 8930,
        averageSearchTime: 1250,
        searchConversionRate: 23.5,
        noResultsRate: 8.2,
        topSearches: [
          { query: 't-shirts', count: 1250, trend: 'up' },
          { query: 'jeans', count: 980, trend: 'stable' },
          { query: 'sneakers', count: 875, trend: 'up' },
          { query: 'dresses', count: 720, trend: 'down' },
          { query: 'jackets', count: 650, trend: 'up' },
          { query: 'bags', count: 580, trend: 'stable' },
          { query: 'watches', count: 520, trend: 'up' },
          { query: 'shoes', count: 480, trend: 'down' }
        ],
        popularFilters: [
          { name: 'Brand', usage: 65 },
          { name: 'Price Range', usage: 58 },
          { name: 'Size', usage: 45 },
          { name: 'Color', usage: 42 },
          { name: 'Rating', usage: 38 }
        ],
        searchTrends: [
          { date: '2024-01-01', searches: 450, conversions: 105 },
          { date: '2024-01-02', searches: 520, conversions: 125 },
          { date: '2024-01-03', searches: 480, conversions: 115 },
          { date: '2024-01-04', searches: 610, conversions: 145 },
          { date: '2024-01-05', searches: 580, conversions: 140 },
          { date: '2024-01-06', searches: 720, conversions: 170 },
          { date: '2024-01-07', searches: 680, conversions: 160 }
        ]
      };
      
      setAnalyticsData(data || mockData);
    } catch (err) {
      console.error('Failed to load search analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Search Analytics</h2>
            <p className="text-sm text-gray-500">Performance metrics for the last {timeRange}</p>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Searches */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Searches</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(analyticsData.totalSearches)}
                </p>
              </div>
              <Search className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          {/* Unique Searchers */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Unique Searchers</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(analyticsData.uniqueSearchers)}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-900">
                  {analyticsData.searchConversionRate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          {/* Avg Search Time */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg Search Time</p>
                <p className="text-2xl font-bold text-orange-900">
                  {analyticsData.averageSearchTime}ms
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Top Searches */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Search Queries</h3>
            <div className="space-y-3">
              {analyticsData.topSearches.map((search, index) => (
                <div key={search.query} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      #{index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{search.query}</span>
                    {getTrendIcon(search.trend)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatNumber(search.count)}
                    </p>
                    <p className="text-xs text-gray-500">searches</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Filters */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Filters</h3>
            <div className="space-y-3">
              {analyticsData.popularFilters.map((filter) => (
                <div key={filter.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{filter.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${filter.usage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-10">
                      {filter.usage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* No Results Rate */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">No Results Rate</p>
                <p className="text-xl font-bold text-red-900">
                  {analyticsData.noResultsRate}%
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Searches returning no results
                </p>
              </div>
              <Eye className="w-6 h-6 text-red-500" />
            </div>
          </div>

          {/* Search Trends */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">7-Day Trend</h4>
            <div className="flex items-end space-x-1 h-16">
              {analyticsData.searchTrends.map((day, index) => {
                const maxSearches = Math.max(...analyticsData.searchTrends.map(d => d.searches));
                const height = (day.searches / maxSearches) * 100;
                
                return (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${height}%` }}
                    title={`${day.searches} searches, ${day.conversions} conversions`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>7 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Insights</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• "T-shirts" is your top performing search query with strong upward trend</li>
            <li>• Brand filtering is used by 65% of searchers - consider promoting brand pages</li>
            <li>• {analyticsData.noResultsRate}% no-results rate suggests opportunity to expand inventory</li>
            <li>• Search conversion rate of {analyticsData.searchConversionRate}% is above industry average</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchAnalytics;