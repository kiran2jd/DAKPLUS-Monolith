import React from 'react';
import { BookOpen, ShoppingCart, Star } from 'lucide-react';

export default function BooksPage() {
    const books = [
        {
            id: 1,
            title: "Departmental Exam Guide - Paper 1",
            author: "Kiran Kumar",
            rating: 4.8,
            price: "₹399",
            image: "https://via.placeholder.com/150",
            link: "#" // Affiliate link here
        },
        {
            id: 2,
            title: "Postal Manual Volume V",
            author: "Expert Faculty",
            rating: 4.5,
            price: "₹299",
            image: "https://via.placeholder.com/150",
            link: "#"
        },
        {
            id: 3,
            title: "GDS directly to MTS/Postman",
            author: "Exam Master",
            rating: 4.7,
            price: "₹450",
            image: "https://via.placeholder.com/150",
            link: "#"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-12 rounded-b-3xl shadow-xl mb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="text-white h-8 w-8" />
                        <h1 className="text-3xl font-bold text-white">Recommended Books</h1>
                    </div>
                    <p className="text-white/90">Curated study material to boost your exam preparation.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map(book => (
                    <div key={book.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition flex flex-col">
                        <div className="h-48 bg-gray-200 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                            {/* In real app, use actual images */}
                            <BookOpen className="text-gray-400 h-16 w-16" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{book.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">by {book.author}</p>

                        <div className="flex items-center gap-1 mb-4">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-bold text-gray-700">{book.rating}</span>
                        </div>

                        <div className="mt-auto flex justify-between items-center">
                            <span className="text-xl font-bold text-gray-900">{book.price}</span>
                            <a
                                href={book.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition"
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Buy Now
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
