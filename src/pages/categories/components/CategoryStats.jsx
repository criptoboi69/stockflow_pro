import React from 'react';
import Icon from '../../../components/AppIcon';

const CategoryStats = ({ categories }) => {
  const totalCategories = categories?.length;
  const totalProducts = categories?.reduce((sum, cat) => sum + cat?.productCount, 0);
  const emptyCategories = categories?.filter(cat => cat?.productCount === 0)?.length;
  const averageProducts = totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0;

  const stats = [
    {
      label: 'Total catégories',
      value: totalCategories,
      icon: 'FolderTree',
      color: 'primary'
    },
    {
      label: 'Total produits',
      value: totalProducts,
      icon: 'Package',
      color: 'success'
    },
    {
      label: 'Catégories vides',
      value: emptyCategories,
      icon: 'FolderOpen',
      color: 'warning'
    },
    {
      label: 'Moyenne par catégorie',
      value: averageProducts,
      icon: 'BarChart3',
      color: 'accent'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats?.map((stat, index) => (
        <div key={index} className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <div className={`
              w-10 h-10 rounded-lg flex items-center justify-center
              ${stat?.color === 'primary' ? 'bg-primary/10 text-primary' :
                stat?.color === 'success' ? 'bg-success/10 text-success' :
                stat?.color === 'warning'? 'bg-warning/10 text-warning' : 'bg-accent/10 text-accent'
              }
            `}>
              <Icon name={stat?.icon} size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{stat?.value}</p>
              <p className="text-sm text-text-muted">{stat?.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryStats;