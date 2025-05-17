// Add this error handling to your image components

<img 
  src={photoUrl || '/images/placeholder-location.jpg'} 
  alt={name}
  className="w-full h-40 object-cover rounded-t-lg"
  onError={(e) => {
    e.currentTarget.src = '/images/placeholder-location.jpg';
    console.log('Image failed to load, using placeholder');
  }}
/>