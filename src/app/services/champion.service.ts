import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChampionResponse {
  success: boolean;
  champions: string[];
}

export interface ToggleChampionResponse {
  success: boolean;
  champions: string[];
  message?: string;
}

export interface PublicStateResponse {
  success: boolean;
  public: boolean;
  message?: string;
}

export interface PublicUserResponse {
  success: boolean;
  user: {
    id: number;
    username: string;
    public: boolean;
    champs: string[];
    createdAt: string;
    lastUse: string;
  } | null;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChampionService {
  private readonly API_BASE_URL = 'http://localhost:8080/lolarena';

  constructor(private http: HttpClient) { }

  getChampions(): Observable<ChampionResponse> {
    return this.http.get<ChampionResponse>(`${this.API_BASE_URL}/champions`);
  }

  toggleChampion(userId: number, championName: string): Observable<ToggleChampionResponse> {
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('championName', championName);

    return this.http.post<ToggleChampionResponse>(`${this.API_BASE_URL}/toggle-champion`, formData);
  }

  setPublicState(userId: number, isPublic: boolean): Observable<PublicStateResponse> {
    return this.http.post<PublicStateResponse>(`${this.API_BASE_URL}/set-public-state`, {
      userId,
      public: isPublic
    });
  }

  getPublicUser(username: string): Observable<PublicUserResponse> {
    return this.http.get<PublicUserResponse>(`${this.API_BASE_URL}/user/${username}`);
  }

  processChampionName(champ: string): string {
    // Special case handling for specific champions
    let bgChampName = champ;
    if (champ === "Wukong") bgChampName = "MonkeyKing";
    else if (champ === "Renata Glasc") bgChampName = "Renata";
    else if (champ === "K'Sante") bgChampName = "KSante";
    else if (champ === "Kog'Maw") bgChampName = "KogMaw";
    else if (champ === "Rek'Sai") bgChampName = "RekSai";
    else if (champ === "LeBlanc") bgChampName = "Leblanc";

    // 1. Replace apostrophes and make the next letter lowercase
    bgChampName = bgChampName.replace(/\'([A-Z])/g, (match, p1) => p1.toLowerCase());

    // 2. Remove any remaining spaces and periods
    return bgChampName.replace(/[ .]/g, "");
  }
}