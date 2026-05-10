<?php

namespace Database\Seeders;

use App\Enums\ParkingStatus;
use App\Models\Parking;
use App\Models\User;
use Illuminate\Database\Seeder;

class ParkingSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'owner@geopark.com')->first();

        if (!$owner) return;

        $parkings = [
            [
                'owner_id' => $owner->id,
                'title' => 'თბილისის ცენტრალური პარკინგი',
                'description' => 'დიდი, უსაფრთხო პარკინგი თბილისის ცენტრში. 24/7 დაცვა, CCTV კამერები.',
                'address' => 'რუსთაველის გამზირი 12, თბილისი',
                'latitude' => 41.7151,
                'longitude' => 44.8271,
                'total_slots' => 50,
                'available_slots' => 35,
                'base_price' => 5.00,
                'status' => ParkingStatus::Active,
                'opening_time' => '00:00',
                'closing_time' => '23:59',
                'amenities' => ['CCTV', '24/7 დაცვა', 'ელექტრო მანქანების დამუხტვა', 'გადახურული'],
                'is_verified' => true,
            ],
            [
                'owner_id' => $owner->id,
                'title' => 'ძველი თბილისის პარკინგი',
                'description' => 'მყუდრო პარკინგი ძველი თბილისის გულში. იდეალურია ტურისტებისთვის.',
                'address' => 'შარდენის ქუჩა 5, თბილისი',
                'latitude' => 41.6914,
                'longitude' => 44.8015,
                'total_slots' => 20,
                'available_slots' => 8,
                'base_price' => 7.00,
                'status' => ParkingStatus::Active,
                'opening_time' => '08:00',
                'closing_time' => '23:00',
                'amenities' => ['CCTV', 'დაფარული', 'წვდომა ეტლით'],
                'is_verified' => true,
            ],
            [
                'owner_id' => $owner->id,
                'title' => 'თბილისი მოლის პარკინგი',
                'description' => 'დიდი პარკინგი სავაჭრო ცენტრთან. ფართო ადგილები, მარტივი მისასვლელი.',
                'address' => 'ჭავჭავაძის გამზირი 45, თბილისი',
                'latitude' => 41.7225,
                'longitude' => 44.7500,
                'total_slots' => 200,
                'available_slots' => 120,
                'base_price' => 3.00,
                'status' => ParkingStatus::Active,
                'opening_time' => '09:00',
                'closing_time' => '22:00',
                'amenities' => ['CCTV', '24/7 დაცვა', 'ელექტრო მანქანების დამუხტვა', 'დაფარული', 'წვდომა ეტლით', 'ვალეტ პარკინგი'],
                'is_verified' => true,
            ],
            [
                'owner_id' => $owner->id,
                'title' => 'ბათუმის ცენტრალური პარკინგი',
                'description' => 'პარკინგი ბათუმის ბულვართან ახლოს. ზაფხულის სეზონზე მაღალი მოთხოვნა.',
                'address' => 'ნიკოლოზ ბარათაშვილის ქუჩა 10, ბათუმი',
                'latitude' => 41.6368,
                'longitude' => 41.6367,
                'total_slots' => 80,
                'available_slots' => 45,
                'base_price' => 6.00,
                'status' => ParkingStatus::Active,
                'opening_time' => '07:00',
                'closing_time' => '23:00',
                'amenities' => ['CCTV', '24/7 დაცვა', 'გადახურული'],
                'is_verified' => true,
            ],
            [
                'owner_id' => $owner->id,
                'title' => 'ქუთაისის აეროპორტის პარკინგი',
                'description' => 'გრძელვადიანი პარკინგი ქუთაისის აეროპორტში. იდეალურია მოგზაურებისთვის.',
                'address' => 'ქუთაისის საერთაშორისო აეროპორტი, ქუთაისი',
                'latitude' => 42.1766,
                'longitude' => 42.5958,
                'total_slots' => 150,
                'available_slots' => 100,
                'base_price' => 2.50,
                'status' => ParkingStatus::Active,
                'opening_time' => '00:00',
                'closing_time' => '23:59',
                'amenities' => ['CCTV', '24/7 დაცვა', 'გრძელვადიანი ფასდაკლება', 'ტრანსფერი'],
                'is_verified' => true,
            ],
        ];

        foreach ($parkings as $parking) {
            Parking::firstOrCreate(
                ['title' => $parking['title']],
                $parking
            );
        }
    }
}
