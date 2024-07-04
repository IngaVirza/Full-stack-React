import React, { useEffect } from 'react';
import { useAxiosFetch } from '../../../hooks/useAxiosFetch';
import { useState } from 'react';
import { Cart } from './Cart';

export const PopularClasses = () => {
  const axiosFetch = useAxiosFetch();
  const [classes, setClasses] = useState([]);
  useEffect(() => {
    const fetchClasses = async () => {
      const response = await axiosFetch.get('/classes');
      //   console.log(response);
      setClasses(response.data);
    };
    fetchClasses();
  }, []);
  return (
    <div className="md:w-[80%] mx-auto my-36">
      <div>
        <h1 className="text-5xl font-bold text-center">
          Our <span className="text-secondary">Popular</span> Classes
        </h1>
        <div className="w-[40%] text-center mx-auto my-4">
          <p className="text-gray-500">
            Explore our Popular Classes. Hero is some popular classes based on
            How many student enrolled
          </p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.slice(0, 6).map((item, index) => (
          <Cart key={index} item={item} />
        ))}
      </div>
    </div>
  );
};
