import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';

interface MyLatLngLiteral {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-google-map',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class GoogleMapComponent implements OnInit {
  @ViewChild(GoogleMap, { static: false }) map!: GoogleMap;

  polygonCoordinates: MyLatLngLiteral[] = [];
  markers: google.maps.Marker[] = [];
  polygon: google.maps.Polygon | undefined;
  center: MyLatLngLiteral = { lat: 0, lng: 0 };
  areaText: google.maps.InfoWindow | undefined;

  ngOnInit(): void {
    this.setCurrentLocation();
  }

  setCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.addMarker(this.center);
      });
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }

  addLatLng(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const coords = event.latLng.toJSON() as MyLatLngLiteral;

      if (this.isPolygonComplete(coords)) {
        this.polygonCoordinates.push(this.polygonCoordinates[0]);
        this.drawPolygon();
      } else {
        this.addPolygonPoint(coords);
        this.addMarker(coords);
        this.drawPolygon();
      }
    }
  }

  isPolygonComplete(newPoint: MyLatLngLiteral): boolean {
    if (this.polygonCoordinates.length < 3) {
      return false;
    }
    const firstPoint = this.polygonCoordinates[0];
    const distance = this.calculateDistance(firstPoint, newPoint);
    return distance < 0.0001;
  }

  calculateDistance(point1: MyLatLngLiteral, point2: MyLatLngLiteral): number {
    return Math.sqrt(Math.pow(point1.lat - point2.lat, 2) + Math.pow(point1.lng - point2.lng, 2));
  }

  addMarker(position: MyLatLngLiteral) {
    const marker = new google.maps.Marker({
      position: position,
      map: this.map.googleMap!,
    });
    this.markers.push(marker);
  }

  addPolygonPoint(position: MyLatLngLiteral) {
    this.polygonCoordinates.push(position);
  }

  drawPolygon() {
    if (this.polygon) {
      this.polygon.setMap(null);
    }

    this.polygon = new google.maps.Polygon({
      paths: this.polygonCoordinates,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
    });

    this.polygon.setMap(this.map.googleMap!);

    // คำนวณพื้นที่และแสดงผล
    this.calculateAndDisplayArea();
  }

  calculateAndDisplayArea() {
    const areaInSquareMeters = google.maps.geometry.spherical.computeArea(
      this.polygon!.getPath()
    );

    const areaInRai = areaInSquareMeters / 1600; // 1 ไร่ = 1600 ตารางเมตร
    const areaInNgan = (areaInRai % 1) * 4; // 1 งาน = 400 ตารางเมตร = 1/4 ไร่

    const areaText = `พื้นที่: ${Math.floor(areaInRai)} ไร่ ${Math.floor(areaInNgan)} งาน`;

    // ลบข้อความพื้นที่ที่แสดงก่อนหน้า
    if (this.areaText) {
      this.areaText.close();
    }

    // แสดงข้อความบนแผนที่
    this.areaText = new google.maps.InfoWindow({
      content: areaText,
      position: this.center,
    });

    this.areaText.open(this.map.googleMap!);
  }

  clearAll() {
    if (this.polygon) {
      this.polygon.setMap(null);
    }
    this.markers.forEach(marker => marker.setMap(null));
    this.polygonCoordinates = [];
    this.markers = [];

    if (this.areaText) {
      this.areaText.close();
    }
  }
}
